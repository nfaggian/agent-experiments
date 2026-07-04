export type OpportunityStage =
  | "prospect"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "at_risk";

export type EngineerStatus = "available" | "allocated" | "overallocated";

export interface Engineer {
  id: string;
  name: string;
  role: string;
  email: string;
  capacity: number;
  utilization: number;
  status: EngineerStatus;
  skills: string[];
  currentProjects: string[];
  avatar?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  client: string;
  stage: OpportunityStage;
  value: number;
  probability: number;
  owner: string;
  expectedClose: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  leadEngineer: string;
  team: string[];
  description: string;
  milestones: Milestone[];
  opportunityId?: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Database {
  engineers: Engineer[];
  opportunities: Opportunity[];
  projects: Project[];
  lastUpdated: string;
}

export interface DashboardMetrics {
  pipelineValue: number;
  totalPipeline: number;
  activeOpportunities: number;
  activeProjects: number;
  atRiskProjects: number;
  avgUtilization: number;
  availableCapacity: number;
  wonThisQuarter: number;
  teamSize: number;
  lastUpdated: string;
}

export const OPPORTUNITY_STAGES: {
  id: OpportunityStage;
  label: string;
  color: string;
}[] = [
  { id: "prospect", label: "Prospect", color: "bg-slate-400" },
  { id: "qualified", label: "Qualified", color: "bg-blue-400" },
  { id: "proposal", label: "Proposal", color: "bg-violet-400" },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-400" },
  { id: "won", label: "Won", color: "bg-emerald-400" },
  { id: "lost", label: "Lost", color: "bg-red-400" },
];

export const PROJECT_STATUSES: {
  id: ProjectStatus;
  label: string;
  color: string;
}[] = [
  { id: "planning", label: "Planning", color: "bg-slate-400" },
  { id: "active", label: "Active", color: "bg-emerald-500" },
  { id: "on_hold", label: "On Hold", color: "bg-amber-400" },
  { id: "at_risk", label: "At Risk", color: "bg-red-500" },
  { id: "completed", label: "Completed", color: "bg-blue-500" },
];
