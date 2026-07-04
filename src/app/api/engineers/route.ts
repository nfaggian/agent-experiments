import { NextResponse } from "next/server";
import { getDatabase, updateEngineerUtilization } from "@/core/store";

export async function GET() {
  const db = getDatabase();
  return NextResponse.json(db.engineers);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, utilization } = body as { id: string; utilization: number };
  const updated = updateEngineerUtilization(id, utilization);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
