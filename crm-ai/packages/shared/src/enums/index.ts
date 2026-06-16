export enum ProjectStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ProjectPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum ClientStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  BLOCKED = "BLOCKED",
}

export enum RequirementSource {
  CLIENT = "CLIENT",
  DEVELOPER = "DEVELOPER",
  ADMIN = "ADMIN",
  AI = "AI",
}

export enum RequirementStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  IMPLEMENTED = "IMPLEMENTED",
}

export enum SenderType {
  CLIENT = "CLIENT",
  DEVELOPER = "DEVELOPER",
  SYSTEM = "SYSTEM",
  AGENT = "AGENT",
  ADMIN = "ADMIN",
}

export enum MessageChannel {
  GMAIL = "GMAIL",
  WHATSAPP = "WHATSAPP",
  DASHBOARD = "DASHBOARD",
}

export enum DeveloperRole {
  FRONTEND = "FRONTEND",
  BACKEND = "BACKEND",
  FULLSTACK = "FULLSTACK",
  DESIGNER = "DESIGNER",
  QA = "QA",
}

export enum DeveloperStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BUSY = "BUSY",
}

export enum AssignmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  REMOVED = "REMOVED",
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  REVIEW = "REVIEW",
  DONE = "DONE",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum ReminderType {
  CLIENT = "CLIENT",
  DEVELOPER = "DEVELOPER",
  PROJECT = "PROJECT",
  PAYMENT = "PAYMENT",
  DEADLINE = "DEADLINE",
}

export enum ReminderStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  CANCELLED = "CANCELLED",
}

export enum ReceiverType {
  CLIENT = "CLIENT",
  DEVELOPER = "DEVELOPER",
  ADMIN = "ADMIN",
}

export enum NotificationChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  SYSTEM = "SYSTEM",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

export enum IntentType {
  GENERAL = "GENERAL",
  NEW_REQUIREMENT = "NEW_REQUIREMENT",
  PROGRESS_QUERY = "PROGRESS_QUERY",
  BUDGET_QUERY = "BUDGET_QUERY",
  DEADLINE_QUERY = "DEADLINE_QUERY",
  TASK_UPDATE = "TASK_UPDATE",
  COMPLAINT = "COMPLAINT",
}

export enum AgentType {
  COORDINATOR = "COORDINATOR",
  CONVERSATION = "CONVERSATION",
  REMINDER = "REMINDER",
  ASSIGNMENT = "ASSIGNMENT",
}
