/**
 * Routing oracle pipeline.
 *
 * Chains: delegate_to_model → weather_report → consensus_vote
 * to validate routing decisions against known-good mappings.
 */

import type {
  DelegateResponse,
  WeatherResponse,
  VoteResponse,
  RoutingExpectation,
  RoutingValidation,
  OracleReport,
  OracleConfig,
  VotingStrategy,
} from './types.js';
import {
  DelegateResponseSchema,
  WeatherResponseSchema,
  VoteResponseSchema,
} from './types.js';

// ============================================================================
// Tool caller abstraction
// ============================================================================

export interface ToolCaller {
  call(toolName: string, args: Record<string, unknown>): Promise<unknown>;
}

// ============================================================================
// Individual steps
// ============================================================================

/** Step 1: Route a task and validate against expectation. */
export async function routeAndValidate(
  caller: ToolCaller,
  expectation: RoutingExpectation
): Promise<RoutingValidation> {
  const raw = await caller.call('delegate_to_model', {
    task: expectation.task,
    preferred_capability: expectation.preferredCapability,
  });
  const result = DelegateResponseSchema.parse(raw);

  const correct = expectation.acceptableModels.some(
    (m) => result.recommended_model.includes(m) || m.includes(result.recommended_model)
  );

  return {
    category: expectation.category,
    recommended: result.recommended_model,
    expected: expectation.expectedPrimaryCli,
    correct,
    reasoning: result.reasoning,
    alternatives: result.alternatives.map((a) => a.model),
  };
}

/** Step 2: Fetch weather report for routing context. */
export async function fetchWeather(
  caller: ToolCaller
): Promise<WeatherResponse> {
  const raw = await caller.call('weather_report', {
    includeAdaptive: true,
  });
  return WeatherResponseSchema.parse(raw);
}

/** Step 3: Vote on routing quality. */
export async function voteOnQuality(
  caller: ToolCaller,
  validations: readonly RoutingValidation[],
  strategy: VotingStrategy = 'simple_majority'
): Promise<VoteResponse> {
  const correct = validations.filter((v) => v.correct).length;
  const total = validations.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const summary = validations
    .map(
      (v) =>
        `${v.category}: ${v.correct ? 'CORRECT' : 'WRONG'} ` +
        `(got ${v.recommended}, expected ${v.expected})`
    )
    .join('\n');

  const proposal =
    `Routing accuracy is ${accuracy}% (${correct}/${total} correct).\n\n` +
    `Results:\n${summary}\n\n` +
    `Should we approve this routing quality?`;

  const raw = await caller.call('consensus_vote', {
    proposal,
    strategy,
    quickMode: true,
    simulateVotes: false,
  });
  return VoteResponseSchema.parse(raw);
}

// ============================================================================
// Accuracy computation
// ============================================================================

/** Compute accuracy from validations. */
export function computeAccuracy(
  validations: readonly RoutingValidation[]
): number {
  if (validations.length === 0) return 0;
  const correct = validations.filter((v) => v.correct).length;
  return Math.round((correct / validations.length) * 1000) / 1000;
}

/** Extract misrouted categories from validations. */
export function getMisrouted(
  validations: readonly RoutingValidation[]
): readonly RoutingValidation[] {
  return validations.filter((v) => !v.correct);
}

/** Check if weather confirms expected CLI for a category. */
export function weatherConfirms(
  weather: WeatherResponse,
  category: string,
  expectedCli: string
): boolean {
  const mapping = weather.recommendedMappings?.find(
    (m) => m.category === category
  );
  if (mapping === undefined) return false;
  return mapping.recommendedCli === expectedCli;
}

// ============================================================================
// Full pipeline
// ============================================================================

/** Run the complete routing oracle pipeline. */
export async function runOraclePipeline(
  caller: ToolCaller,
  config: OracleConfig
): Promise<OracleReport> {
  // Step 1: Route all tasks
  const validations: RoutingValidation[] = [];
  for (const exp of config.expectations) {
    try {
      const v = await routeAndValidate(caller, exp);
      validations.push(v);
    } catch {
      validations.push({
        category: exp.category,
        recommended: 'ERROR',
        expected: exp.expectedPrimaryCli,
        correct: false,
        reasoning: 'Tool call failed',
        alternatives: [],
      });
    }
  }

  const accuracy = computeAccuracy(validations);

  // Step 2: Fetch weather (if configured)
  let weather: WeatherResponse | null = null;
  if (config.includeWeather === true) {
    try {
      weather = await fetchWeather(caller);
    } catch {
      weather = null;
    }
  }

  // Step 3: Vote on quality (if configured)
  let voteResult: VoteResponse | null = null;
  if (config.includeVote === true) {
    try {
      voteResult = await voteOnQuality(
        caller,
        validations,
        config.voteStrategy
      );
    } catch {
      voteResult = null;
    }
  }

  return { validations, accuracy, weather, voteResult };
}
