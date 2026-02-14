#!/usr/bin/env tsx
/**
 * Run the routing oracle against a live nexus-agents MCP server.
 *
 * Usage: NEXUS_LIVE=true npx tsx src/run-live.ts
 */

import { runOraclePipeline } from './oracle-pipeline.js';
import { isLiveMode } from './live-caller.js';
import type { ToolCaller } from './oracle-pipeline.js';

async function main(): Promise<void> {
  if (!isLiveMode()) {
    console.error('Set NEXUS_LIVE=true to run against a live MCP server.');
    process.exit(1);
  }

  let caller: ToolCaller;
  try {
    const bridgePath = './live-bridge.js';
    const mod: Record<string, unknown> = await import(bridgePath);
    const factory = mod['createMcpCaller'] as (() => Promise<ToolCaller>) | undefined;
    if (typeof factory !== 'function') throw new Error('live-bridge.ts must export createMcpCaller()');
    caller = await factory();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Failed to load live bridge: ${msg}`);
    process.exit(1);
  }

  console.log('Running routing oracle against live MCP server...\n');
  const result = await runOraclePipeline(caller, {
    expectations: [
      {
        category: 'code_generation',
        task: 'Implement a REST API with authentication',
        preferredCapability: 'code',
        expectedPrimaryCli: 'claude',
        acceptableModels: ['claude-opus-4-6', 'claude-sonnet-4-5-20250929'],
      },
    ],
    includeWeather: true,
    includeVote: true,
  });
  console.log(JSON.stringify(result, null, 2));
}

void main();
