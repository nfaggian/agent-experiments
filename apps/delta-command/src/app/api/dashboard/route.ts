import { NextResponse } from "next/server";
import { getDatabase, getDashboardMetrics } from "@/core/store";

export async function GET() {
  const db = getDatabase();
  const metrics = getDashboardMetrics(db);
  return NextResponse.json({ ...metrics, lastUpdated: db.lastUpdated });
}
