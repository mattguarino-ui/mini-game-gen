import { Sandbox } from "@vercel/sandbox";

const GATEWAY_BASE_URL = process.env.VERCEL_AI_GATEWAY_URL ?? "https://ai-gateway.vercel.sh";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

async function callAIGateway(prompt: string): Promise<string> {
  "use step";

  // Route through Vercel AI Gateway
  const response = await fetch(`${GATEWAY_BASE_URL}/anthropic/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI Gateway error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function validateWithSandbox(htmlCode: string): Promise<{ valid: boolean; report: string; lineCount: number; hasCanvas: boolean; hasTouchSupport: boolean }> {
  "use step";

  // Spin up ephemeral Vercel Sandbox compute
  const sandbox = await Sandbox.create({
    runtime: "python3.13",
    timeout: 30,
  });

  try {
    // Write the HTML to a file in the sandbox
    await sandbox.writeFiles([
      {
        path: "/tmp/game.html",
        content: htmlCode,
      },
    ]);

    // Run a Python linter/validator in the ephemeral sandbox
    const result = await sandbox.runCommand(
      "python3",
      [
        "-c",
        `
import re, sys

with open('/tmp/game.html', 'r') as f:
    content = f.read()

issues = []
line_count = len(content.splitlines())
has_canvas = '<canvas' in content
has_touch = 'touchstart' in content or 'ontouchstart' in content
has_game_loop = 'requestAnimationFrame' in content or 'setInterval' in content
has_script = '<script' in content

if not has_script:
    issues.append('WARNING: No <script> tag found')
if not has_game_loop:
    issues.append('WARNING: No game loop detected (requestAnimationFrame or setInterval)')
if line_count < 50:
    issues.append('WARNING: Code seems very short for a game')

print(f'LINES:{line_count}')
print(f'HAS_CANVAS:{has_canvas}')
print(f'HAS_TOUCH:{has_touch}')
print(f'ISSUES:{len(issues)}')
for issue in issues:
    print(issue)
if not issues:
    print('VALIDATION_PASSED: All checks passed')
`,
      ]
    );

    const output = await result.stdout() ?? "";
    const lineMatch = output.match(/LINES:(\d+)/);
    const canvasMatch = output.match(/HAS_CANVAS:(True|False)/);
    const touchMatch = output.match(/HAS_TOUCH:(True|False)/);

    return {
      valid: output.includes("VALIDATION_PASSED"),
      report: output,
      lineCount: lineMatch ? parseInt(lineMatch[1]) : 0,
      hasCanvas: canvasMatch ? canvasMatch[1] === "True" : false,
      hasTouchSupport: touchMatch ? touchMatch[1] === "True" : false,
    };
  } finally {
    await sandbox.stop();
  }
}

export interface GameGeneratorInput {
  game: string;
  twist: string;
}

export interface GameGeneratorResult {
  html: string;
  validation: {
    valid: boolean;
    report: string;
    lineCount: number;
    hasCanvas: boolean;
    hasTouchSupport: boolean;
  };
  gameTitle: string;
  description: string;
}

export async function generateGame(input: GameGeneratorInput): Promise<GameGeneratorResult> {
  "use workflow";

  const { game, twist } = input;

  // Step 1: Generate game code via AI Gateway
  const gameTitle = `${game}${twist ? `: ${twist}` : ""}`;
  const prompt = `Create a complete, self-contained HTML5 game of ${game}${twist ? ` with this twist: ${twist}` : ""}.

Requirements:
- Single HTML file with all CSS and JavaScript inline
- Must be fully playable in an iframe
- Use canvas or DOM for rendering
- Include keyboard controls AND touch/click controls for mobile
- Add a score display and game over/restart functionality
- Make it visually appealing with colors and styling
- The game must actually work - test your logic carefully
- Start the game automatically or show a clear "Click to Start" button
- Keep the code under 300 lines but make it complete

Return ONLY the complete HTML code, nothing else. Start with <!DOCTYPE html>.`;

  const generatedHtml = await callAIGateway(prompt);

  // Extract just the HTML if it's wrapped in markdown code blocks
  const htmlMatch = generatedHtml.match(/```html\n?([\s\S]*?)```/) ||
    generatedHtml.match(/```\n?([\s\S]*?)```/);
  const cleanHtml = htmlMatch ? htmlMatch[1].trim() : generatedHtml.trim();

  // Step 2: Validate with Sandbox
  const validation = await validateWithSandbox(cleanHtml);

  return {
    html: cleanHtml,
    validation,
    gameTitle,
    description: `A ${game} game${twist ? ` with a "${twist}" twist` : ""}, generated and validated by Vercel AI.`,
  };
}
