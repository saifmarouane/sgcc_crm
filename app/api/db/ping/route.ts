import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.command({ ping: 1 });

    return NextResponse.json({
      ok: result.ok === 1,
      database: db.databaseName,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown MongoDB connection error";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
