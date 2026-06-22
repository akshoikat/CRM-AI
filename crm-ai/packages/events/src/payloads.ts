export interface ProjectCreatedPayload {
  projectId: string;
  clientId: string;
}

export interface ProjectUpdatedPayload {
  projectId: string;
  changes: Record<string, unknown>;
}

export interface ClientCreatedPayload {
  clientId: string;
}

export interface ClientMessageReceivedPayload {
  projectId: string;
  conversationId: string;
  message: string;
  channel: string;
}

export interface ClientMessageSentPayload {
  projectId: string;
  conversationId: string;
  message: string;
  channel: string;
}

export interface NewRequirementDetectedPayload {
  projectId: string;
  requirementId: string;
}

export interface RequirementCreatedPayload {
  projectId: string;
  requirementId: string;
}

export interface DeveloperAssignedPayload {
  projectId: string;
  developerId: string;
  assignmentId: string;
}

export interface TaskCreatedPayload {
  projectId: string;
  taskId: string;
  developerId?: string;
}

export interface DeadlineApproachingPayload {
  projectId: string;
  deadline: string;
  daysRemaining: number;
}

export interface ReminderTriggeredPayload {
  reminderId: string;
  projectId: string;
  type: string;
}

export interface MemoryUpdatedPayload {
  projectId: string;
}

export interface AgentMessagePayload {
  toAgentId: string;
  fromAgentId: string;
  event: string;
  data: unknown;
  correlationId?: string;
}

export interface AgentRegisteredPayload {
  agentId: string;
  username: string;
}

export type EventPayloads = {
  PROJECT_CREATED: ProjectCreatedPayload;
  PROJECT_UPDATED: ProjectUpdatedPayload;
  CLIENT_CREATED: ClientCreatedPayload;
  CLIENT_MESSAGE_RECEIVED: ClientMessageReceivedPayload;
  CLIENT_MESSAGE_SENT: ClientMessageSentPayload;
  NEW_REQUIREMENT_DETECTED: NewRequirementDetectedPayload;
  REQUIREMENT_CREATED: RequirementCreatedPayload;
  DEVELOPER_ASSIGNED: DeveloperAssignedPayload;
  TASK_CREATED: TaskCreatedPayload;
  DEADLINE_APPROACHING: DeadlineApproachingPayload;
  REMINDER_TRIGGERED: ReminderTriggeredPayload;
  MEMORY_UPDATED: MemoryUpdatedPayload;
  INTENT_DETECTED: { projectId: string; intent: string };
  TASK_COMPLETED: { projectId: string; taskId: string; developerId?: string };
  AGENT_MESSAGE_SENT: AgentMessagePayload;
  AGENT_REGISTERED: AgentRegisteredPayload;
  AGENT_REQUEST_RECEIVED: AgentMessagePayload;
  AGENT_RESPONSE_SENT: AgentMessagePayload;
  AGENT_STATUS_CHANGED: { agentId: string; status: string };
  AGENT_ERROR: { agentId: string; error: string; event: string };
};
