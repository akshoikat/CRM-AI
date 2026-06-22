import OpenAI from "openai";
import { prisma } from "@crm-ai/db";
import {
  EventName,
  register,
  emit,
  respond,
} from "@crm-ai/events";
import { logger } from "@crm-ai/logger";
import { ReminderType } from "@crm-ai/shared";

const AGENT_ID = "AG-0007";

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

export interface MeetingAgenda {
  title: string;
  date: string;
  attendees: string[];
  objectives: string[];
  topics: { title: string; duration: number; notes: string }[];
  followUpTasks: { title: string; assignee: string; deadline: string }[];
}

export class MeetingAgent {
  constructor() {
    register(AGENT_ID, {
      [EventName.PROJECT_CREATED]: this.onProjectCreated.bind(this),
      [EventName.AGENT_REQUEST_RECEIVED]: this.onRequest.bind(this),
    });
    logger.info({ agentId: AGENT_ID }, "MeetingAgent registered");
  }

  private async onProjectCreated(payload: any) {
    const { projectId } = payload;
    logger.info({ projectId }, "MeetingAgent: new project — scheduling kickoff");

    try {
      const reminder = await prisma.reminder.create({
        data: {
          projectId,
          type: ReminderType.PROJECT,
          scheduleAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      });
      logger.info({ reminderId: reminder.id, projectId }, "MeetingAgent: kickoff reminder created");
    } catch (err) {
      logger.error({ err, projectId }, "MeetingAgent: failed to create reminder");
    }
  }

  private async onRequest(payload: any) {
    const { _correlationId, action, projectId, data } = payload;
    if (!_correlationId) return;

    try {
      switch (action) {
        case "generateAgenda": {
          const agenda = await this.generateAgenda(projectId);
          respond(_correlationId, { agenda });

          await emit(EventName.MEETING_CREATED, { projectId, title: agenda.title });
          break;
        }
        case "scheduleMeeting": {
          const reminder = await prisma.reminder.create({
            data: {
              projectId,
              type: ReminderType.PROJECT,
              scheduleAt: data?.scheduledDate
                ? new Date(data.scheduledDate)
                : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
          });

          await emit(EventName.MEETING_CREATED, {
            projectId,
            title: data?.title || "Project Meeting",
            reminderId: reminder.id,
          });

          respond(_correlationId, { reminder, meetingId: reminder.id });
          break;
        }
        case "generateFollowUp": {
          const tasks = await this.generateFollowUpTasks(projectId);
          respond(_correlationId, { tasks });
          break;
        }
        default:
          respond(_correlationId, { error: `Unknown action: ${action}` });
      }
    } catch (err: any) {
      logger.error({ err, action, projectId }, "MeetingAgent request failed");
      respond(_correlationId, { error: err.message });
    }
  }

  async generateAgenda(projectId: string): Promise<MeetingAgenda> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true, requirements: { take: 10 }, assignments: { include: { developer: true } } },
    });

    const clientName = project?.client?.name || "Client";
    const projectTitle = project?.title || "Project";
    const requirements = project?.requirements.map((r) => r.title) || [];
    const attendees = project?.assignments.map((a) => a.developer.name) || [];

    if (!deepseek) {
      return {
        title: `${projectTitle} — Kickoff Meeting`,
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        attendees: [clientName, ...attendees],
        objectives: ["Review project requirements", "Set timeline", "Assign responsibilities"],
        topics: [
          { title: "Project Overview", duration: 15, notes: "Review project scope and deliverables" },
          { title: "Requirements Review", duration: 20, notes: requirements.join(", ") },
          { title: "Timeline & Milestones", duration: 15, notes: "Set key dates" },
          { title: "Next Steps", duration: 10, notes: "Action items and follow-ups" },
        ],
        followUpTasks: [
          { title: "Finalize requirements", assignee: attendees[0] || "team", deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] },
        ],
      };
    }

    try {
      const response = await deepseek.chat.completions.create({
        model: aiModel,
        messages: [
          {
            role: "system",
            content:
              "You are a meeting facilitator for a software development agency. " +
              "Generate a meeting agenda in JSON format based on the project context.",
          },
          {
            role: "user",
            content: `Project: ${projectTitle}\nClient: ${clientName}\nAttendees: ${attendees.join(", ") || "team"}\nRequirements: ${requirements.join(", ")}\n\nGenerate a meeting agenda JSON with: title, objectives[], topics[{title, duration, notes}], followUpTasks[{title, assignee, deadline}]. Date should be 3 days from now.`,
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            title: parsed.title || `${projectTitle} — Meeting`,
            date: parsed.date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            attendees: [clientName, ...attendees],
            objectives: parsed.objectives || [],
            topics: parsed.topics || [],
            followUpTasks: parsed.followUpTasks || [],
          };
        }
      }
    } catch (err) {
      logger.error({ err }, "MeetingAgent: AI agenda generation failed");
    }

    return {
      title: `${projectTitle} — Kickoff Meeting`,
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      attendees: [clientName, ...attendees],
      objectives: ["Review project requirements", "Set timeline", "Assign responsibilities"],
      topics: [
        { title: "Project Overview", duration: 15, notes: "Review project scope" },
        { title: "Requirements Review", duration: 20, notes: requirements.join(", ") },
        { title: "Timeline & Milestones", duration: 15, notes: "Set key dates" },
        { title: "Next Steps", duration: 10, notes: "Action items and follow-ups" },
      ],
      followUpTasks: [],
    };
  }

  async generateFollowUpTasks(projectId: string): Promise<any[]> {
    const tasks = await prisma.task.findMany({
      where: { projectId, status: { not: "DONE" } },
      take: 10,
      include: { developer: true },
    });

    return tasks.map((t) => ({
      taskId: t.id,
      title: t.title,
      assignee: t.developer?.name || "Unassigned",
      status: t.status,
      deadline: t.deadline?.toISOString().split("T")[0] || "Not set",
    }));
  }
}
