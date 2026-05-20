"use client";

import { useState } from "react";

const GAMES = [
  { id: "Snake", emoji: "🐍", desc: "Classic snake" },
  { id: "Pong", emoji: "🏓", desc: "Ping pong" },
  { id: "Breakout", emoji: "🧱", desc: "Break the bricks" },
  { id: "Tic Tac Toe", emoji: "⭕", desc: "X's and O's" },
  { id: "2048", emoji: "🔢", desc: "Merge tiles" },
  { id: "Memory Match", emoji: "🃏", desc: "Find the pairs" },
];

type Phase = "idle" | "starting" | "polling" | "done" | "error";

interface GameResult {
  html: string;
  gameTitle: string;
  description: string;
  validation: {
    valid: boolean;
    report: string;
    lineCount: number;
    hasCanvas: boolean;
    hasTouchSupport: boolean;
  };
}

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [twist, setTwist] = useState<string>("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [runId, setRunId] = useState<string>("");
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string>("");
  const [stepIdx, setStepIdx] = useState(0);

  const STEP_LABELS = [
    "🚀 Workflow started — durable run created",
    "🤖 Step 1: AI Gateway generating game code...",
    "📦 Step 2: Spinning up Vercel Sandbox...",
    "🔍 Step 2: Validating code in ephemeral compute...",
    "✅ Step 3: Returning result via Compute function...",
  ];

  async function handleGenerate() {
    if (!selectedGame) return;
    setPhase("starting");
    setResult(null);
    setError("");
    setStepIdx(0);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: selectedGame, twist }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start workflow");

      setRunId(data.runId);
      setPhase("polling");
      setStepIdx(1);

      let attempts = 0;
      const maxAttempts = 120;

      const poll = async () => {
        if (attempts >= maxAttempts) {
          throw new Error("Timed out waiting for game generation");
        }

        const statusRes = await fetch(`/api/status/${data.runId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "completed" && statusData.output) {
          setResult(statusData.output as GameResult);
          setPhase("done");
          setStepIdx(5);
          return;
        } else if (statusData.status === "failed") {
          throw new Error(statusData.error || "Workflow failed");
        }

        const elapsed = attempts * 2;
        if (elapsed > 8) setStepIdx(2);
        if (elapsed > 18) setStepIdx(3);
        if (elapsed > 28) setStepIdx(4);

        attempts++;
        setTimeout(poll, 2000);
      };

      setTimeout(poll, 1000);
    } catch (err) {
      setError(String(err));
      setPhase("error");
    }
  }

  const isLoading = phase === "starting" || phase === "polling";

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e8f0", fontFamily: "'Courier New', monospace" }}>
      <header style={{ borderBottom: "1px solid #1e1e2e", padding: "18px 32px", display: "flex", alignItems: "center", gap: "12px", background: "#0d0d18" }}>
        <div style={{ width: 30, height: 30, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🎮</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.05em" }}>GAME<span style={{ color: "#6366f1" }}>GEN</span></div>
          <div style={{ fontSize: 9, color: "#444455", letterSpacing: "0.1em" }}>POWERED BY VERCEL AI PRIMITIVES</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["HOSTING", "COMPUTE", "AI GATEWAY", "WORKFLOWS", "SANDBOX"].map((label) => (
            <span key={label} style={{ fontSize: 9, padding: "3px 6px", border: "1px solid #1e1e2e", borderRadius: 4, color: "#444455", letterSpacing: "0.08em" }}>{label}</span>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 44, textAlign: "center" }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Mini Game<br />
            <span style={{ background: "linear-gradient(90deg, #6366f1, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Generator</span>
          </h1>
          <p style={{ color: "#444455", marginTop: 14, fontSize: 13, letterSpacing: "0.02em" }}>
            One click → Workflow → AI Gateway → Sandbox → Compute → playable game
          </p>
        </div>

        {phase !== "done" && (
          <>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 10, color: "#444455", letterSpacing: "0.12em", marginBottom: 12 }}>SELECT GAME</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {GAMES.map((g) => (
                  <button key={g.id} onClick={() => setSelectedGame(g.id)} style={{ padding: "13px 14px", background: selectedGame === g.id ? "rgba(99, 102, 241, 0.12)" : "#0d0d18", border: selectedGame === g.id ? "1px solid #6366f1" : "1px solid #1e1e2e", borderRadius: 8, cursor: "pointer", color: selectedGame === g.id ? "#a78bfa" : "#777788", textAlign: "left", fontFamily: "inherit" }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{g.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{g.id}</div>
                    <div style={{ fontSize: 10, color: "#333344", marginTop: 2 }}>{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 10, color: "#444455", letterSpacing: "0.12em", marginBottom: 10 }}>TWIST <span style={{ color: "#222233" }}>(OPTIONAL)</span></label>
              <input type="text" placeholder='e.g. "but with cats", "in space", "neon cyberpunk style"' value={twist} onChange={(e) => setTwist(e.target.value)} disabled={isLoading} style={{ width: "100%", padding: "11px 14px", background: "#0d0d18", border: "1px solid #1e1e2e", borderRadius: 8, color: "#e8e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>

            <button onClick={handleGenerate} disabled={!selectedGame || isLoading} style={{ width: "100%", padding: "15px", background: !selectedGame || isLoading ? "#111120" : "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 8, color: !selectedGame || isLoading ? "#222233" : "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", cursor: !selectedGame || isLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {isLoading ? "⚡ GENERATING..." : "⚡ GENERATE GAME"}
            </button>
          </>
        )}

        {isLoading && (
          <div style={{ marginTop: 28, padding: 22, background: "#0d0d18", border: "1px solid #1e1e2e", borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: "#444455", letterSpacing: "0.12em", marginBottom: 14 }}>WORKFLOW EXECUTION</div>
            {STEP_LABELS.map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 0", fontSize: 12, color: i <= stepIdx ? "#a78bfa" : "#2a2a3a", borderBottom: i < STEP_LABELS.length - 1 ? "1px solid #0f0f1a" : "none" }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: i < stepIdx ? "#6366f1" : i === stepIdx ? "rgba(99,102,241,0.25)" : "#111120", border: `1.5px solid ${i <= stepIdx ? "#6366f1" : "#1e1e2e"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, flexShrink: 0, color: "#fff" }}>
                  {i < stepIdx ? "✓" : ""}
                </span>
                {label}
                {i === stepIdx && <span style={{ marginLeft: "auto", color: "#6366f1", fontSize: 10 }}>●</span>}
              </div>
            ))}
            {runId && <div style={{ marginTop: 14, fontSize: 9, color: "#222233", fontFamily: "monospace" }}>RUN ID: {runId}</div>}
          </div>
        )}

        {phase === "error" && (
          <div style={{ marginTop: 20, padding: 18, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#ef4444", fontSize: 12 }}>
            <strong>Error:</strong> {error}
            <button onClick={() => setPhase("idle")} style={{ display: "block", marginTop: 10, padding: "6px 14px", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 5, color: "#ef4444", cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>← Try again</button>
          </div>
        )}

        {phase === "done" && result && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#a78bfa" }}>{result.gameTitle}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#444455" }}>{result.description}</p>
              </div>
              <button onClick={() => { setPhase("idle"); setResult(null); setSelectedGame(""); setTwist(""); }} style={{ padding: "7px 14px", background: "transparent", border: "1px solid #1e1e2e", borderRadius: 6, color: "#444455", cursor: "pointer", fontFamily: "inherit", fontSize: 11, letterSpacing: "0.05em", whiteSpace: "nowrap", marginLeft: 16 }}>← NEW GAME</button>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {[
                { label: `${result.validation.lineCount} lines`, active: true },
                { label: result.validation.valid ? "✓ SANDBOX VALIDATED" : "⚠ SANDBOX WARNINGS", active: result.validation.valid },
                { label: result.validation.hasCanvas ? "✓ CANVAS" : "DOM", active: result.validation.hasCanvas },
                { label: result.validation.hasTouchSupport ? "✓ TOUCH" : "KEYBOARD ONLY", active: result.validation.hasTouchSupport },
              ].map((badge) => (
                <span key={badge.label} style={{ fontSize: 9, padding: "3px 7px", border: `1px solid ${badge.active ? "#6366f1" : "#1e1e2e"}`, borderRadius: 4, color: badge.active ? "#a78bfa" : "#2a2a3a", letterSpacing: "0.06em", background: badge.active ? "rgba(99,102,241,0.05)" : "transparent" }}>{badge.label}</span>
              ))}
            </div>

            <div style={{ border: "1px solid #1e1e2e", borderRadius: 8, overflow: "hidden", background: "#000" }}>
              <div style={{ padding: "7px 14px", background: "#0d0d18", borderBottom: "1px solid #1e1e2e", display: "flex", alignItems: "center", gap: 6 }}>
                {["#ff5f57", "#ffbd2e", "#28c941"].map((c) => (<div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />))}
                <span style={{ fontSize: 10, color: "#333344", marginLeft: 6 }}>{result.gameTitle}</span>
              </div>
              <iframe srcDoc={result.html} style={{ width: "100%", height: 500, border: "none", display: "block" }} title={result.gameTitle} sandbox="allow-scripts" />
            </div>
          </div>
        )}
      </div>

      <style>{`* { box-sizing: border-box; } input::placeholder { color: #222233; } input:focus { border-color: #6366f1 !important; }`}</style>
    </main>
  );
}
