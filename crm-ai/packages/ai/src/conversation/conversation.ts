import OpenAI from "openai";
import { prisma } from "@crm-ai/db";
import {
  IntentType,
  SenderType,
  MessageChannel,
  ProjectContext,
  ProjectMemory,
  RequirementSource,
} from "@crm-ai/shared";
import { MemoryService } from "@crm-ai/memory";
import { EventName, emit } from "@crm-ai/events";
import { logger } from "@crm-ai/logger";

function createDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  });
}

const deepseek = createDeepSeek();
const aiModel = process.env.DEEPSEEK_MODEL || "deepseek-chat";

type IntentResult = {
  intent: IntentType;
  confidence: number;
  extractedData?: Record<string, unknown>;
};

export class ConversationAgent {
  private memoryService: MemoryService;

  constructor() {
    this.memoryService = new MemoryService();
  }

  async processMessage(data: {
    projectId: string;
    message: string;
    channel: string;
    senderType?: string;
  }): Promise<{
    response: string;
    conversationId: string;
    intent: IntentResult;
  }> {
    const { projectId, message, channel } = data;

    try {
      const conversation = await prisma.conversation.create({
        data: {
          projectId,
          message,
          channel: channel as MessageChannel,
          senderType: (data.senderType as SenderType) || "CLIENT",
        },
      });

      const memory = await this.memoryService.getMemory(projectId);

      const intent = await this.detectIntentWithAI(message, projectId);

      logger.info({ projectId, intent: intent.intent, confidence: intent.confidence }, "Intent detected");

      await emit(EventName.INTENT_DETECTED, { projectId, intent: intent.intent });

      if (intent.intent === IntentType.NEW_REQUIREMENT) {
        try {
          await this.handleNewRequirement(projectId, message, intent.extractedData);
        } catch (err) {
          logger.error({ err, projectId }, "Failed to handle new requirement");
        }
      }

      const response = await this.generateResponse(message, memory, projectId);

      await prisma.conversation.create({
        data: {
          projectId,
          message: response,
          channel: channel as MessageChannel,
          senderType: SenderType.AGENT,
        },
      });

      try {
        await emit(EventName.CLIENT_MESSAGE_SENT, {
          projectId,
          conversationId: conversation.id,
          message: response,
          channel,
        });
      } catch (err) {
        logger.error({ err, projectId }, "Failed to emit CLIENT_MESSAGE_SENT");
      }

      // Build memory best-effort; a failure here does not affect the response
      // and the stale memory will be refreshed on the next successful invocation.
      try {
        await this.memoryService.buildMemory(projectId);
      } catch (err) {
        logger.error({ err, projectId }, "Failed to build memory");
      }

      return { response, conversationId: conversation.id, intent };
    } catch (error) {
      logger.error({ err: error, projectId }, "processMessage failed");
      return {
        response: "I'm sorry, I encountered an error processing your message. Please try again.",
        conversationId: "",
        intent: { intent: IntentType.GENERAL, confidence: 0 },
      };
    }
  }

  private async detectIntentWithAI(
    message: string,
    projectId: string
  ): Promise<IntentResult> {
    if (!deepseek) {
      return { intent: this.detectIntent(message), confidence: 0.5 };
    }

    try {
      const response = await deepseek.chat.completions.create({
        model: aiModel,
        timeout: 30000,
        messages: [
          {
            role: "system",
            content:
              "You classify client messages for a project management CRM. " +
              "Respond with a function call to detect_intent.",
          },
          { role: "user", content: message },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "detect_intent",
              description: "Detect the intent of a client message",
              parameters: {
                type: "object",
                properties: {
                  intent: {
                    type: "string",
                    enum: [
                      "NEW_REQUIREMENT",
                      "PROGRESS_QUERY",
                      "BUDGET_QUERY",
                      "DEADLINE_QUERY",
                      "TASK_UPDATE",
                      "COMPLAINT",
                      "GENERAL",
                    ],
                    description: "The detected intent category",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score 0-1",
                  },
                  extractedData: {
                    type: "object",
                    description: "Any data extracted from the message",
                    properties: {
                      title: {
                        type: "string",
                        description: "Requirement title if NEW_REQUIREMENT",
                      },
                      amount: {
                        type: "number",
                        description: "Budget amount if BUDGET_QUERY",
                      },
                      taskId: {
                        type: "string",
                        description: "Task ID if TASK_UPDATE",
                      },
                      newStatus: {
                        type: "string",
                        description: "New status if TASK_UPDATE",
                      },
                    },
                  },
                },
                required: ["intent", "confidence"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "detect_intent" } },
      });

      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        return {
          intent: parsed.intent as IntentType,
          confidence: parsed.confidence ?? 0.9,
          extractedData: parsed.extractedData,
        };
      }
    } catch (err) {
      logger.error({ err }, "OpenAI intent detection failed, falling back");
    }

    return { intent: this.detectIntent(message), confidence: 0.5 };
  }

  private detectIntent(message: string): IntentType {
    const lower = message.toLowerCase();
    if (
      lower.includes("add ") ||
      lower.includes("new ") ||
      lower.includes("need ") ||
      lower.includes("require")
    )
      return IntentType.NEW_REQUIREMENT;
    if (lower.includes("progress") || lower.includes("status") || lower.includes("update"))
      return IntentType.PROGRESS_QUERY;
    if (lower.includes("budget") || lower.includes("cost") || lower.includes("price"))
      return IntentType.BUDGET_QUERY;
    if (lower.includes("deadline") || lower.includes("when") || lower.includes("due"))
      return IntentType.DEADLINE_QUERY;
    if (lower.includes("issue") || lower.includes("problem") || lower.includes("bug") || lower.includes("complaint"))
      return IntentType.COMPLAINT;
    return IntentType.GENERAL;
  }

  private async handleNewRequirement(
    projectId: string,
    message: string,
    extractedData?: Record<string, unknown>
  ) {
    const title =
      (extractedData?.title as string) || message.slice(0, 100);
    const requirement = await prisma.requirement.create({
      data: {
        projectId,
        title,
        description: message,
        source: RequirementSource.CLIENT,
      },
    });

    await emit(EventName.NEW_REQUIREMENT_DETECTED, {
      projectId,
      requirementId: requirement.id,
    });
  }

  private async loadProjectContext(
    projectId: string
  ): Promise<ProjectContext | null> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true },
    });
    if (!project) return null;

    const [requirements, recentConversations, tasks, assignments] =
      await Promise.all([
        prisma.requirement.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.conversation.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.task.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.assignment.findMany({
          where: { projectId },
          include: { developer: true },
        }),
      ]);

    const memory = await this.memoryService.getMemory(projectId);

    return {
      project: project as any,
      client: project.client as any,
      requirements,
      recentConversations,
      memory: memory as ProjectMemory | null,
      tasks,
      assignments,
    };
  }

  private async generateResponse(
    message: string,
    memory: any,
    projectId: string
  ): Promise<string> {
    if (!deepseek) {
      return `Thank you for your message. I've noted your input regarding the project. ${
        memory?.nextAction ? `Next step: ${memory.nextAction}` : ""
      }`;
    }

    try {
      const context = await this.loadProjectContext(projectId);

      const systemPrompt = [
        "You are a helpful project management assistant for a CRM system.",
        "You help manage client projects, track requirements, and coordinate tasks.",
        "Be concise, professional, and friendly.",
        "",
        "=== PROJECT CONTEXT ===",
        context
          ? [
              `Project: ${context.project.title}`,
              `Status: ${context.project.status}`,
              `Budget: ${context.project.budget} ${context.project.currency || ""}`,
              `Deadline: ${
                context.project.deadline
                  ? new Date(context.project.deadline).toISOString().split("T")[0]
                  : "Not set"
              }`,
              "",
              "=== RECENT CONVERSATIONS ===",
              ...context.recentConversations
                .slice(0, 5)
                .map(
                  (c) =>
                    `[${c.senderType}] ${c.createdAt}: ${c.message.slice(0, 200)}`
                ),
              "",
              "=== REQUIREMENTS ===",
              ...context.requirements
                .slice(0, 10)
                .map((r) => `- ${r.title} (${r.status})`),
              "",
              "=== MEMORY ===",
              memory?.summary ? `Summary: ${memory.summary}` : "",
              memory?.nextAction
                ? `Next action: ${memory.nextAction}`
                : "",
              memory?.lastTopics?.length
                ? `Recent topics: ${memory.lastTopics.join(", ")}`
                : "",
              memory?.risks?.length
                ? `Risks: ${memory.risks.join(", ")}`
                : "",
            ].join("\n")
          : "No project context available.",
        "",
        "Respond naturally to the client's message. If they mentioned a new requirement, acknowledge it.",
        "If they ask about progress, budget, or deadlines, provide relevant information from the context.",
      ].join("\n");

      const result = await deepseek.chat.completions.create({
        model: aiModel,
        timeout: 30000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return result.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    } catch (err) {
      logger.error({ err }, "OpenAI response generation failed, falling back");
      return `Thank you for your message. I've noted your input regarding the project. ${
        memory?.nextAction ? `Next step: ${memory.nextAction}` : ""
      }`;
    }
  }
}
