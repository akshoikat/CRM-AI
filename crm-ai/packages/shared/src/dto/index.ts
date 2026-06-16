export type CreateClientDto = {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  company?: string;
  timezone?: string;
};

export type UpdateClientDto = Partial<CreateClientDto>;

export type CreateProjectDto = {
  clientId: string;
  title: string;
  description?: string;
  statement?: string;
  budget?: number;
  currency?: string;
  priority?: string;
  startDate?: string;
  deadline?: string;
};

export type UpdateProjectDto = Partial<CreateProjectDto>;

export type CreateDeveloperDto = {
  name: string;
  email: string;
  phone?: string;
  skills?: unknown;
};

export type CreateTaskDto = {
  projectId: string;
  developerId?: string;
  title: string;
  description?: string;
  priority?: string;
  startDate?: string;
  deadline?: string;
};

export type UpdateTaskDto = Partial<CreateTaskDto> & { status?: string };

export type SendMessageDto = {
  projectId: string;
  message: string;
  channel: string;
};
