import { getNeonSql } from "../../../../db/neon";

export async function GET() {
  try {
    const sql = getNeonSql();
    const [result] = await sql`select now() as server_time`;

    return Response.json({ ok: true, database: "neon", result });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown Neon error",
      },
      { status: 500 },
    );
  }
}
