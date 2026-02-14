/**
 * Oracle pipeline tests — routing validation, weather, and voting.
 */

import { describe, it, expect, vi } from 'vitest';
import type { ToolCaller } from './oracle-pipeline.js';
import {
  routeAndValidate,
  fetchWeather,
  voteOnQuality,
  computeAccuracy,
  getMisrouted,
  weatherConfirms,
  runOraclePipeline,
} from './oracle-pipeline.js';
import type { RoutingValidation, OracleConfig } from './types.js';
import {
  DEFAULT_EXPECTATIONS,
  MOCK_DELEGATE_ARCHITECTURE,
  MOCK_DELEGATE_CODE,
  MOCK_DELEGATE_RESEARCH,
  MOCK_DELEGATE_WRONG,
  MOCK_WEATHER_HEALTHY,
  MOCK_WEATHER_COLD,
  MOCK_VOTE_APPROVED,
  MOCK_VOTE_REJECTED,
} from './fixtures/mock-responses.js';

function createMockCaller(
  responses: Record<string, unknown>
): ToolCaller & { calls: Array<{ tool: string; args: Record<string, unknown> }> } {
  const calls: Array<{ tool: string; args: Record<string, unknown> }> = [];
  return {
    calls,
    call: vi.fn(async (toolName: string, args: Record<string, unknown>) => {
      calls.push({ tool: toolName, args });
      const response = responses[toolName];
      if (response === undefined) throw new Error(`No mock: ${toolName}`);
      return response;
    }),
  };
}

// ============================================================================
// routeAndValidate
// ============================================================================

describe('routeAndValidate', () => {
  it('validates correct routing for architecture', async () => {
    const caller = createMockCaller({
      delegate_to_model: MOCK_DELEGATE_ARCHITECTURE,
    });

    const result = await routeAndValidate(caller, DEFAULT_EXPECTATIONS[0]!);

    expect(result.category).toBe('architecture');
    expect(result.recommended).toBe('claude-opus');
    expect(result.correct).toBe(true);
    expect(result.reasoning).toContain('claude-opus');
  });

  it('validates correct routing for code generation', async () => {
    const caller = createMockCaller({
      delegate_to_model: MOCK_DELEGATE_CODE,
    });

    const result = await routeAndValidate(caller, DEFAULT_EXPECTATIONS[1]!);

    expect(result.category).toBe('code_generation');
    expect(result.recommended).toBe('codex-5.3');
    expect(result.correct).toBe(true);
  });

  it('detects incorrect routing', async () => {
    const caller = createMockCaller({
      delegate_to_model: MOCK_DELEGATE_WRONG,
    });

    const result = await routeAndValidate(caller, DEFAULT_EXPECTATIONS[0]!);

    expect(result.category).toBe('architecture');
    expect(result.recommended).toBe('gemini-flash');
    expect(result.correct).toBe(false);
  });

  it('passes correct args to delegate_to_model', async () => {
    const caller = createMockCaller({
      delegate_to_model: MOCK_DELEGATE_ARCHITECTURE,
    });

    await routeAndValidate(caller, DEFAULT_EXPECTATIONS[0]!);

    expect(caller.calls[0]?.args).toEqual({
      task: DEFAULT_EXPECTATIONS[0]!.task,
      preferred_capability: DEFAULT_EXPECTATIONS[0]!.preferredCapability,
    });
  });

  it('includes alternatives in result', async () => {
    const caller = createMockCaller({
      delegate_to_model: MOCK_DELEGATE_CODE,
    });

    const result = await routeAndValidate(caller, DEFAULT_EXPECTATIONS[1]!);

    expect(result.alternatives.length).toBeGreaterThan(0);
    expect(result.alternatives).toContain('codex-5.2');
  });
});

// ============================================================================
// fetchWeather
// ============================================================================

describe('fetchWeather', () => {
  it('returns weather data', async () => {
    const caller = createMockCaller({
      weather_report: MOCK_WEATHER_HEALTHY,
    });

    const result = await fetchWeather(caller);

    expect(result.overall.totalTasks).toBe(50);
    expect(result.cliWeather.length).toBe(3);
  });

  it('handles cold weather state', async () => {
    const caller = createMockCaller({
      weather_report: MOCK_WEATHER_COLD,
    });

    const result = await fetchWeather(caller);

    expect(result.overall.totalTasks).toBe(0);
    expect(result.cliWeather.length).toBe(0);
  });

  it('passes includeAdaptive flag', async () => {
    const caller = createMockCaller({
      weather_report: MOCK_WEATHER_HEALTHY,
    });

    await fetchWeather(caller);

    expect(caller.calls[0]?.args).toEqual({ includeAdaptive: true });
  });
});

// ============================================================================
// voteOnQuality
// ============================================================================

describe('voteOnQuality', () => {
  it('builds proposal from validations', async () => {
    const caller = createMockCaller({
      consensus_vote: MOCK_VOTE_APPROVED,
    });
    const validations: RoutingValidation[] = [
      {
        category: 'architecture',
        recommended: 'claude-opus',
        expected: 'claude',
        correct: true,
        reasoning: 'Good routing',
        alternatives: [],
      },
    ];

    await voteOnQuality(caller, validations);

    const proposal = caller.calls[0]?.args['proposal'] as string;
    expect(proposal).toContain('100%');
    expect(proposal).toContain('CORRECT');
  });

  it('returns vote decision', async () => {
    const caller = createMockCaller({
      consensus_vote: MOCK_VOTE_APPROVED,
    });

    const result = await voteOnQuality(caller, []);

    expect(result.decision).toBe('approved');
    expect(result.votes.length).toBe(3);
  });

  it('uses specified strategy', async () => {
    const caller = createMockCaller({
      consensus_vote: MOCK_VOTE_REJECTED,
    });

    await voteOnQuality(caller, [], 'supermajority');

    expect(caller.calls[0]?.args['strategy']).toBe('supermajority');
  });
});

// ============================================================================
// computeAccuracy / getMisrouted / weatherConfirms
// ============================================================================

describe('computeAccuracy', () => {
  it('computes 100% for all correct', () => {
    const validations: RoutingValidation[] = [
      { category: 'architecture', recommended: 'a', expected: 'a', correct: true, reasoning: '', alternatives: [] },
      { category: 'testing', recommended: 'b', expected: 'b', correct: true, reasoning: '', alternatives: [] },
    ];
    expect(computeAccuracy(validations)).toBe(1);
  });

  it('computes 50% for half correct', () => {
    const validations: RoutingValidation[] = [
      { category: 'architecture', recommended: 'a', expected: 'a', correct: true, reasoning: '', alternatives: [] },
      { category: 'testing', recommended: 'x', expected: 'b', correct: false, reasoning: '', alternatives: [] },
    ];
    expect(computeAccuracy(validations)).toBe(0.5);
  });

  it('returns 0 for empty', () => {
    expect(computeAccuracy([])).toBe(0);
  });
});

describe('getMisrouted', () => {
  it('returns only incorrect validations', () => {
    const validations: RoutingValidation[] = [
      { category: 'architecture', recommended: 'a', expected: 'a', correct: true, reasoning: '', alternatives: [] },
      { category: 'testing', recommended: 'x', expected: 'b', correct: false, reasoning: '', alternatives: [] },
    ];
    const misrouted = getMisrouted(validations);
    expect(misrouted.length).toBe(1);
    expect(misrouted[0]!.category).toBe('testing');
  });

  it('returns empty for all correct', () => {
    const validations: RoutingValidation[] = [
      { category: 'architecture', recommended: 'a', expected: 'a', correct: true, reasoning: '', alternatives: [] },
    ];
    expect(getMisrouted(validations).length).toBe(0);
  });
});

describe('weatherConfirms', () => {
  it('confirms matching recommendation', () => {
    expect(weatherConfirms(MOCK_WEATHER_HEALTHY, 'architecture', 'claude')).toBe(true);
  });

  it('rejects mismatched recommendation', () => {
    expect(weatherConfirms(MOCK_WEATHER_HEALTHY, 'architecture', 'codex')).toBe(false);
  });

  it('returns false for missing category', () => {
    expect(weatherConfirms(MOCK_WEATHER_HEALTHY, 'devops', 'claude')).toBe(false);
  });

  it('returns false for cold weather (no mappings)', () => {
    expect(weatherConfirms(MOCK_WEATHER_COLD, 'architecture', 'claude')).toBe(false);
  });
});

// ============================================================================
// runOraclePipeline
// ============================================================================

describe('runOraclePipeline', () => {
  it('runs full pipeline with all 3 tools', async () => {
    const caller = createMockCaller({
      delegate_to_model: MOCK_DELEGATE_ARCHITECTURE,
      weather_report: MOCK_WEATHER_HEALTHY,
      consensus_vote: MOCK_VOTE_APPROVED,
    });

    const config: OracleConfig = {
      expectations: [DEFAULT_EXPECTATIONS[0]!],
      includeWeather: true,
      includeVote: true,
    };

    const result = await runOraclePipeline(caller, config);

    expect(result.validations.length).toBe(1);
    expect(result.accuracy).toBe(1);
    expect(result.weather).not.toBeNull();
    expect(result.voteResult).not.toBeNull();
    expect(caller.calls.length).toBe(3);
  });

  it('skips weather and vote when not configured', async () => {
    const caller = createMockCaller({
      delegate_to_model: MOCK_DELEGATE_CODE,
    });

    const config: OracleConfig = {
      expectations: [DEFAULT_EXPECTATIONS[1]!],
    };

    const result = await runOraclePipeline(caller, config);

    expect(result.validations.length).toBe(1);
    expect(result.weather).toBeNull();
    expect(result.voteResult).toBeNull();
    expect(caller.calls.length).toBe(1);
  });

  it('handles tool errors gracefully', async () => {
    const caller: ToolCaller = {
      call: vi.fn(async () => {
        throw new Error('Network error');
      }),
    };

    const config: OracleConfig = {
      expectations: [DEFAULT_EXPECTATIONS[0]!],
      includeWeather: true,
      includeVote: true,
    };

    const result = await runOraclePipeline(caller, config);

    expect(result.validations.length).toBe(1);
    expect(result.validations[0]!.recommended).toBe('ERROR');
    expect(result.validations[0]!.correct).toBe(false);
    expect(result.weather).toBeNull();
    expect(result.voteResult).toBeNull();
  });

  it('computes accuracy across multiple categories', async () => {
    let callCount = 0;
    const responses = [
      MOCK_DELEGATE_ARCHITECTURE,
      MOCK_DELEGATE_CODE,
      MOCK_DELEGATE_WRONG,
    ];
    const caller: ToolCaller = {
      call: vi.fn(async () => {
        return responses[callCount++];
      }),
    };

    const config: OracleConfig = {
      expectations: DEFAULT_EXPECTATIONS.slice(0, 3),
    };

    const result = await runOraclePipeline(caller, config);

    expect(result.validations.length).toBe(3);
    // architecture (correct) + code_generation (correct) + code_review (wrong)
    expect(result.accuracy).toBe(0.667);
  });
});
