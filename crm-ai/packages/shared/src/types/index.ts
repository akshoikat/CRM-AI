export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  company: string | null;
  timezone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  statement: string | null;
  budget: number | null;
  currency: string | null;
  priority: string;
  status: string;
  startDate: string | null;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Conversation = {
  id: string;
  projectId: string;
  senderType: string;
  channel: string;
  message: string;
  messageType: string | null;
  createdAt: string;
};

export type Requirement = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  source: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Developer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  skills: unknown;
  availability: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Assignment = {
  id: string;
  projectId: string;
  developerId: string;
  role: string;
  status: string;
  assignedAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  developerId: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  startDate: string | null;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Reminder = {
  id: string;
  projectId: string;
  type: string;
  scheduleAt: string;
  status: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  receiverType: string;
  receiverId: string;
  channel: string;
  title: string;
  body: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
};

export type ProjectMemory = {
  id: string;
  projectId: string;
  summary: string | null;
  lastRequirement: string | null;
  lastDiscussion: string | null;
  nextAction: string | null;
  lastTopics: string[];
  pendingItems: string[];
  risks: string[];
  updatedAt: string;
};

export type Agent = {
  id: string;
  username: string;
  displayName: string;
  version: string;
  capabilities: string[];
  permissions: { can: string[]; cannot: string[] } | null;
  status: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventLog = {
  id: string;
  event: string;
  entityType: string;
  entityId: string;
  payload: unknown;
  createdAt: string;
};

export type ProjectContext = {
  project: Project;
  client: Client;
  requirements: Requirement[];
  recentConversations: Conversation[];
  memory: ProjectMemory | null;
  tasks: Task[];
  assignments: Assignment[];
};

export type ClientPreference = {
  id: string;
  clientId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

export type HistoricalDecision = {
  id: string;
  projectId: string;
  decision: string;
  context: string | null;
  outcome: string | null;
  createdAt: string;
};

export type Document = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[] | null;
  embedding: number[] | null;
  createdAt: string;
  updatedAt: string;
};

export type PendingApproval = {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  data: unknown;
  requestedBy: string;
  approvedBy: string | null;
  status: string;
  reason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
