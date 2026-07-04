import { NextResponse } from "next/server";
import { resetDatabase } from "@/core/store";

export async function POST() {
  const db = resetDatabase();
  return NextResponse.json({ message: "Database reset", lastUpdated: db.lastUpdated });
}
