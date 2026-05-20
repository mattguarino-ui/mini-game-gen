import { start } from "workflow/api";
import { generateGame } from "@/workflows/game-generator";
import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: Request) {
  const { game, twist } = await request.json();

  if (!game) {
    return NextResponse.json({ error: "Game type is required" }, { status: 400 });
  }

  const run = await start(generateGame, [{ game, twist: twist || "" }]);

  return NextResponse.json({
    runId: run.runId,
    status: "started",
    message: `Generating ${game} game...`,
  });
}
