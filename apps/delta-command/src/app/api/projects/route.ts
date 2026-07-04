import { NextResponse } from "next/server";
import { getDatabase, updateProjectStatus } from "@/core/store";
import type { ProjectStatus } from "@/core/types";

export async function GET() {
  const db = getDatabase();
  return NextResponse.json(db.projects);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status } = body as { id: string; status: ProjectStatus };
  const updated = updateProjectStatus(id, status);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
