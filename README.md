# Mini Game Generator

A demo app showcasing all 5 Vercel AI primitives firing from a single button click.

## Architecture

```
User clicks "Generate" 
  → POST /api/generate (Vercel Compute)
    → start(generateGame, ...) (Vercel Workflow)
      → Step 1: callAIGateway() (Vercel AI Gateway → Claude)
      → Step 2: validateWithSandbox() (Vercel Sandbox ephemeral compute)
  → GET /api/status/[runId] (Vercel Compute, polled)
    → game HTML returned, rendered in iframe
```

## Vercel Primitives Used

| Primitive | How |
|---|---|
| **Hosting / Delivery** | Next.js app deployed to Vercel CDN |
| **Compute** | `/api/generate` and `/api/status/[runId]` as serverless functions |
| **AI Gateway** | All Claude calls routed through `VERCEL_AI_GATEWAY_URL` |
| **Workflows** | `generateGame()` with `"use workflow"` directive, 2 durable steps |
| **Sandbox** | Ephemeral `python3.13` runtime validates generated game code |

## Setup

1. Clone this repo
2. Connect to Vercel: `vercel link`
3. Set environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY` — your Anthropic key
   - `VERCEL_AI_GATEWAY_URL` — from Vercel AI Gateway dashboard (e.g. `https://ai-gateway.vercel.sh`)
4. Deploy: `vercel --prod`

## Dashboard Walkthrough

After generating a game, you can show:
- **Deployments tab**: build log, live URL
- **Functions tab**: `/api/generate` and `/api/status/*` invocations
- **AI Gateway tab**: Claude model calls with latency/tokens
- **Workflows tab**: `generateGame` run with step-by-step timeline
- **Sandbox tab**: ephemeral Python compute instances
