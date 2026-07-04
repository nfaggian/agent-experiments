import fs from "fs";
import path from "path";
import type { Database, Opportunity, Project, Engineer, OpportunityStage, ProjectStatus } from "./types";
import { seedData } from "./seed-data";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDatabase(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(seedData, null, 2));
    return seedData;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as Database;
}

function saveDatabase(db: Database) {
  ensureDataDir();
  db.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function updateOpportunityStage(id: string, stage: OpportunityStage): Opportunity | null {
  const db = getDatabase();
  const idx = db.opportunities.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  db.opportunities[idx] = {
    ...db.opportunities[idx],
    stage,
    updatedAt: new Date().toISOString().split("T")[0],
    probability: stage === "won" ? 100 : stage === "lost" ? 0 : db.opportunities[idx].probability,
  };
  saveDatabase(db);
  return db.opportunities[idx];
}

export function updateProjectStatus(id: string, status: ProjectStatus): Project | null {
  const db = getDatabase();
  const idx = db.projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.projects[idx] = { ...db.projects[idx], status };
  saveDatabase(db);
  return db.projects[idx];
}

export function updateEngineerUtilization(id: string, utilization: number): Engineer | null {
  const db = getDatabase();
  const idx = db.engineers.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const status = utilization >= 100 ? "overallocated" : utilization >= 50 ? "allocated" : "available";
  db.engineers[idx] = { ...db.engineers[idx], utilization, status };
  saveDatabase(db);
  return db.engineers[idx];
}

export function getDashboardMetrics(db: Database) {
  const activeOpportunities = db.opportunities.filter(
    (o) => !["won", "lost"].includes(o.stage)
  );
  const pipelineValue = activeOpportunities.reduce(
    (sum, o) => sum + o.value * (o.probability / 100),
    0
  );
  const totalPipeline = activeOpportunities.reduce((sum, o) => sum + o.value, 0);
  const activeProjects = db.projects.filter((p) => p.status === "active" || p.status === "at_risk");
  const atRiskProjects = db.projects.filter((p) => p.status === "at_risk");
  const avgUtilization = Math.round(
    db.engineers.reduce((sum, e) => sum + e.utilization, 0) / db.engineers.length
  );
  const availableCapacity = db.engineers.filter((e) => e.utilization < 70).length;
  const wonThisQuarter = db.opportunities.filter((o) => o.stage === "won").length;

  return {
    pipelineValue,
    totalPipeline,
    activeOpportunities: activeOpportunities.length,
    activeProjects: activeProjects.length,
    atRiskProjects: atRiskProjects.length,
    avgUtilization,
    availableCapacity,
    wonThisQuarter,
    teamSize: db.engineers.length,
  };
}

export function resetDatabase(): Database {
  saveDatabase({ ...seedData, lastUpdated: new Date().toISOString() });
  return getDatabase();
}
