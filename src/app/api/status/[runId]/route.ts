import { getRun } from "workflow/api";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  if (!runId) {
    return NextResponse.json({ error: "Run ID is required" }, { status: 400 });
  }

  try {
    const run = getRun(runId);
    const status = await run.status;

    let output = null;
    let error = null;

    if (status === "completed") {
      try {
        output = await run.returnValue;
      } catch (e) {
        // output not available yet
      }
    } else if (status === "failed") {
      try {
        await run.returnValue;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
      if (!error) error = "Workflow failed";
    }

    return NextResponse.json({
      runId,
      status,
      output,
      error,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to get run status", details: String(err) },
      { status: 500 }
    );
  }
}
