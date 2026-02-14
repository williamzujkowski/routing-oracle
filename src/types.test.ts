/**
 * Zod schema validation tests for routing-oracle.
 */

import { describe, it, expect } from 'vitest';
import {
  DelegateInputSchema,
  DelegateResponseSchema,
  CapabilitiesSchema,
  AlternativeSchema,
  WeatherInputSchema,
  WeatherResponseSchema,
  VoteInputSchema,
  VoteResponseSchema,
} from './types.js';
import {
  MOCK_DELEGATE_ARCHITECTURE,
  MOCK_DELEGATE_CODE,
  MOCK_WEATHER_HEALTHY,
  MOCK_WEATHER_COLD,
  MOCK_VOTE_APPROVED,
  MOCK_VOTE_REJECTED,
} from './fixtures/mock-responses.js';

describe('DelegateInputSchema', () => {
  it('accepts valid input', () => {
    const result = DelegateInputSchema.safeParse({
      task: 'Design an API',
      preferred_capability: 'reasoning',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty task', () => {
    const result = DelegateInputSchema.safeParse({ task: '' });
    expect(result.success).toBe(false);
  });

  it('accepts all capability types', () => {
    for (const cap of ['reasoning', 'context', 'speed', 'code']) {
      const result = DelegateInputSchema.safeParse({
        task: 'test',
        preferred_capability: cap,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid capability', () => {
    const result = DelegateInputSchema.safeParse({
      task: 'test',
      preferred_capability: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts billing modes', () => {
    for (const mode of ['plan', 'api']) {
      const result = DelegateInputSchema.safeParse({
        task: 'test',
        billing_mode: mode,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('DelegateResponseSchema', () => {
  it('validates architecture response', () => {
    const result = DelegateResponseSchema.safeParse(MOCK_DELEGATE_ARCHITECTURE);
    expect(result.success).toBe(true);
  });

  it('validates code response', () => {
    const result = DelegateResponseSchema.safeParse(MOCK_DELEGATE_CODE);
    expect(result.success).toBe(true);
  });

  it('rejects missing model', () => {
    const result = DelegateResponseSchema.safeParse({
      reasoning: 'test',
      capabilities: { reasoning: 1, contextWindow: 1, codeGeneration: 1, speed: 1, cost: 1 },
      estimated_tokens: 0,
      alternatives: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('CapabilitiesSchema', () => {
  it('validates complete capabilities', () => {
    const result = CapabilitiesSchema.safeParse({
      reasoning: 10,
      contextWindow: 200000,
      codeGeneration: 9,
      speed: 5,
      cost: 10,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing field', () => {
    const result = CapabilitiesSchema.safeParse({
      reasoning: 10,
      contextWindow: 200000,
    });
    expect(result.success).toBe(false);
  });
});

describe('AlternativeSchema', () => {
  it('validates alternative entry', () => {
    const result = AlternativeSchema.safeParse({
      model: 'claude-sonnet',
      score: 66,
      tradeoff: 'faster',
    });
    expect(result.success).toBe(true);
  });
});

describe('WeatherInputSchema', () => {
  it('accepts empty input', () => {
    const result = WeatherInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts all CLIs', () => {
    for (const cli of ['claude', 'gemini', 'codex']) {
      const result = WeatherInputSchema.safeParse({ cli });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all categories', () => {
    const categories = [
      'architecture', 'code_generation', 'code_review', 'research',
      'security_review', 'planning', 'documentation', 'testing',
      'devops', 'exploration',
    ];
    for (const category of categories) {
      const result = WeatherInputSchema.safeParse({ category });
      expect(result.success).toBe(true);
    }
  });
});

describe('WeatherResponseSchema', () => {
  it('validates healthy weather', () => {
    const result = WeatherResponseSchema.safeParse(MOCK_WEATHER_HEALTHY);
    expect(result.success).toBe(true);
  });

  it('validates cold weather', () => {
    const result = WeatherResponseSchema.safeParse(MOCK_WEATHER_COLD);
    expect(result.success).toBe(true);
  });

  it('rejects missing overall', () => {
    const result = WeatherResponseSchema.safeParse({
      cliWeather: [],
      adaptiveBonuses: [],
      tierRecommendations: [],
      explorationRate: 0.1,
      coldStartThreshold: 10,
      collectedAt: 'now',
    });
    expect(result.success).toBe(false);
  });
});

describe('VoteInputSchema', () => {
  it('accepts valid proposal', () => {
    const result = VoteInputSchema.safeParse({
      proposal: 'Should we approve?',
      strategy: 'supermajority',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty proposal', () => {
    const result = VoteInputSchema.safeParse({ proposal: '' });
    expect(result.success).toBe(false);
  });

  it('rejects proposal over 4000 chars', () => {
    const result = VoteInputSchema.safeParse({
      proposal: 'x'.repeat(4001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts all strategies', () => {
    const strategies = [
      'simple_majority', 'supermajority', 'unanimous',
      'proof_of_learning', 'higher_order',
    ];
    for (const strategy of strategies) {
      const result = VoteInputSchema.safeParse({
        proposal: 'test',
        strategy,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('VoteResponseSchema', () => {
  it('validates approved response', () => {
    const result = VoteResponseSchema.safeParse(MOCK_VOTE_APPROVED);
    expect(result.success).toBe(true);
  });

  it('validates rejected response', () => {
    const result = VoteResponseSchema.safeParse(MOCK_VOTE_REJECTED);
    expect(result.success).toBe(true);
  });

  it('rejects invalid decision', () => {
    const result = VoteResponseSchema.safeParse({
      ...MOCK_VOTE_APPROVED,
      decision: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});
