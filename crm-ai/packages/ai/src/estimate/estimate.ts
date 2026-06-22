import OpenAI from "openai";
import { prisma } from "@crm-ai/db";
import {
  EventName,
  register,
  respond,
} from "@crm-ai/events";
import { logger } from "@crm-ai/logger";

const AGENT_ID = "AG-0005";

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

export interface EstimateResult {
  estimatedHours: number;
  estimatedCost: number;
  teamSize: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  confidence: number;
  breakdown: string;
}

export class EstimateAgent {
  constructor() {
    register(AGENT_ID, {
      [EventName.AGENT_REQUEST_RECEIVED]: this.onRequest.bind(this),
    });
    logger.info({ agentId: AGENT_ID }, "EstimateAgent registered");
  }

  private async onRequest(payload: any) {
    const { _correlationId } = payload;
    if (!_correlationId) return;

    try {
      const { projectId, requirementDescription } = payload;

      let description = requirementDescription || "";
      if (projectId && !description) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: { requirements: { take: 5, orderBy: { createdAt: "desc" } } },
        });
        if (project) {
          description = [
            project.title,
            project.description,
            ...project.requirements.map((r) => r.title + ": " + (r.description || "")),
          ].filter(Boolean).join("\n");
        }
      }

      if (!description) {
        respond(_correlationId, { error: "No description provided" });
        return;
      }

      const estimate = await this.generateEstimate(description);
      respond(_correlationId, { estimate });
    } catch (err: any) {
      logger.error({ err }, "EstimateAgent request failed");
      respond(_correlationId, { error: err.message });
    }
  }

  async estimate(description: string): Promise<EstimateResult> {
    return this.generateEstimate(description);
  }

  private async generateEstimate(description: string): Promise<EstimateResult> {
    if (!deepseek) {
      return {
        estimatedHours: Math.ceil(description.length / 50) * 5,
        estimatedCost: Math.ceil(description.length / 50) * 250,
        teamSize: 2,
        riskLevel: "MEDIUM",
        confidence: 0.6,
        breakdown: "Rule-based estimate. Configure DEEPSEEK_API_KEY for AI-powered estimates.",
      };
    }

    try {
      const response = await deepseek.chat.completions.create({
        model: aiModel,
        messages: [
          {
            role: "system",
            content:
              "You are a technical project estimator. Analyze the project requirement and provide estimates in JSON format. " +
              "Consider complexity, technology stack, and typical development timelines.",
          },
          {
            role: "user",
            content: `Estimate the following project requirement:\n\n${description}\n\nReturn JSON:
{
  "estimatedHours": number (total person-hours),
  "estimatedCost": number (in USD),
  "teamSize": number (recommended developers),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "confidence": number (0-1),
  "breakdown": string (brief breakdown of estimate)
}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            estimatedHours: parsed.estimatedHours || 40,
            estimatedCost: parsed.estimatedCost || 10000,
            teamSize: parsed.teamSize || 2,
            riskLevel: parsed.riskLevel || "MEDIUM",
            confidence: parsed.confidence || 0.7,
            breakdown: parsed.breakdown || "AI-generated estimate",
          };
        }
      }
    } catch (err) {
      logger.error({ err }, "DeepSeek estimation failed, falling back");
    }

    return {
      estimatedHours: 40,
      estimatedCost: 10000,
      teamSize: 2,
      riskLevel: "MEDIUM",
      confidence: 0.5,
      breakdown: "Fallback estimate (AI unavailable)",
    };
  }
}
