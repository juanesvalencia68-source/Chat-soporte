export type AgentStatus = 'online' | 'busy' | 'away' | 'offline';

export type ViewMode = 'client' | 'agent' | 'leader';

export type DepartmentId = 'soporte' | 'procesos' | 'estafa';

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
}

export type UserRole = 'team_leader' | 'agent';

export interface AgentProfile {
  id: string;
  name: string;
  avatar: string;
  role: string;
  roleType: UserRole;
  department: DepartmentId;
  departmentName: string;
  status: AgentStatus;
  statusBio: string;
  email: string;
  rating: number;
  resolvedCount: number;
  avgResponseTime: string;
  cannedResponses: CannedResponse[];
  // Team Leader specifics (strictly max 10 agents)
  assignedAgentIds?: string[];
  maxAgentsLimit?: number;
  username?: string;
  password?: string;
  channelCode?: string;
  // Agent specifics
  teamLeaderId?: string | null;
  teamLeaderName?: string;
}

export interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  tier: 'Starter' | 'Pro' | 'Empresarial' | 'VIP';
  location: string;
  browser?: string;
  avatar?: string;
}

export type TicketStatus = 'pending' | 'in_progress' | 'transferred' | 'resolved';
export type TicketPriority = 'baja' | 'media' | 'alta' | 'urgente';

export interface Attachment {
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface Message {
  id: string;
  ticketId: string;
  senderType: 'customer' | 'agent' | 'system' | 'internal_note';
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  status?: 'sent' | 'delivered' | 'read';
  impersonatedByLeaderName?: string;
  impersonatedByLeaderId?: string;
}

export interface TicketRating {
  score: number;
  comment?: string;
  createdAt: number;
}

export interface Ticket {
  id: string;
  subject: string;
  department: DepartmentId;
  departmentName: string;
  status: TicketStatus;
  priority: TicketPriority;
  customerId: string;
  customer: CustomerInfo;
  assignedAgentId: string | null;
  assignedAgentName?: string;
  assignedAgentAvatar?: string;
  assignedAgentRole?: string;
  createdAt: number;
  updatedAt: number;
  lastMessageSnippet: string;
  unreadCountClient: number;
  unreadCountAgent: number;
  rating?: TicketRating;
  referredByLeaderId?: string;
  referredByLeaderName?: string;
}

export interface ServerSyncState {
  agents: AgentProfile[];
  tickets: Ticket[];
  messages: Record<string, Message[]>;
}

export interface DepartmentOption {
  id: DepartmentId;
  name: string;
  description: string;
  iconName: string;
}
