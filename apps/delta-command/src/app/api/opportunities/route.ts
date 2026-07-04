import { NextResponse } from "next/server";
import { getDatabase, updateOpportunityStage } from "@/core/store";
import type { OpportunityStage } from "@/core/types";

export async function GET() {
  const db = getDatabase();
  return NextResponse.json(db.opportunities);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, stage } = body as { id: string; stage: OpportunityStage };
  const updated = updateOpportunityStage(id, stage);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
