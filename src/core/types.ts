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

export interface UtilizationWeek {
  weekStart: string;
  utilization: number;
  note?: string;
}

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
  utilizationTimeline?: UtilizationWeek[];
  avatar?: string;
}

export interface UtilizationTimelineWeek {
  weekStart: string;
  label: string;
  isCurrent: boolean;
}

export interface UtilizationTimelineCell {
  weekStart: string;
  utilization: number;
  note?: string;
}

export interface UtilizationTimelineRow {
  engineerId: string;
  name: string;
  role: string;
  cells: UtilizationTimelineCell[];
}

export interface UtilizationTimeline {
  weeks: UtilizationTimelineWeek[];
  rows: UtilizationTimelineRow[];
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
  { id: "prospect", label: "Prospect", color: "bg-outline" },
  { id: "qualified", label: "Qualified", color: "bg-primary" },
  { id: "proposal", label: "Proposal", color: "bg-tertiary" },
  { id: "negotiation", label: "Negotiation", color: "bg-secondary" },
  { id: "won", label: "Won", color: "bg-primary" },
  { id: "lost", label: "Lost", color: "bg-error" },
];

export const PROJECT_STATUSES: {
  id: ProjectStatus;
  label: string;
  color: string;
}[] = [
  { id: "planning", label: "Planning", color: "bg-outline" },
  { id: "active", label: "Active", color: "bg-primary" },
  { id: "on_hold", label: "On Hold", color: "bg-tertiary" },
  { id: "at_risk", label: "At Risk", color: "bg-error" },
  { id: "completed", label: "Completed", color: "bg-secondary" },
];
