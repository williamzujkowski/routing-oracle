/**
 * Mock MCP tool responses for deterministic testing.
 */

import type {
  DelegateResponse,
  WeatherResponse,
  VoteResponse,
  RoutingExpectation,
} from '../types.js';

// ============================================================================
// Routing expectations (known-good mappings)
// ============================================================================

export const DEFAULT_EXPECTATIONS: readonly RoutingExpectation[] = [
  {
    category: 'architecture',
    task: 'Design a microservices architecture for a payment system',
    preferredCapability: 'reasoning',
    expectedPrimaryCli: 'claude',
    acceptableModels: ['claude-opus', 'claude-sonnet'],
  },
  {
    category: 'code_generation',
    task: 'Write unit tests for a TypeScript REST API',
    preferredCapability: 'code',
    expectedPrimaryCli: 'codex',
    acceptableModels: ['codex-5.3', 'codex-5.2', 'claude-sonnet'],
  },
  {
    category: 'code_review',
    task: 'Review this pull request for security vulnerabilities',
    preferredCapability: 'reasoning',
    expectedPrimaryCli: 'codex',
    acceptableModels: ['codex-5.3', 'codex-5.2', 'claude-sonnet'],
  },
  {
    category: 'research',
    task: 'Survey recent papers on transformer attention mechanisms',
    preferredCapability: 'reasoning',
    expectedPrimaryCli: 'gemini',
    acceptableModels: ['gemini-pro', 'gemini-flash', 'claude-sonnet'],
  },
  {
    category: 'security_review',
    task: 'Audit this codebase for OWASP Top 10 vulnerabilities',
    preferredCapability: 'reasoning',
    expectedPrimaryCli: 'claude',
    acceptableModels: ['claude-opus', 'claude-sonnet'],
  },
  {
    category: 'planning',
    task: 'Create a sprint plan for implementing OAuth2 integration',
    preferredCapability: 'reasoning',
    expectedPrimaryCli: 'claude',
    acceptableModels: ['claude-opus', 'claude-sonnet'],
  },
  {
    category: 'documentation',
    task: 'Write API documentation for the REST endpoints',
    preferredCapability: 'reasoning',
    expectedPrimaryCli: 'gemini',
    acceptableModels: ['gemini-pro', 'gemini-flash', 'claude-sonnet'],
  },
  {
    category: 'testing',
    task: 'Generate integration tests for the database layer',
    preferredCapability: 'code',
    expectedPrimaryCli: 'codex',
    acceptableModels: ['codex-5.3', 'codex-5.2', 'claude-sonnet'],
  },
  {
    category: 'devops',
    task: 'Write a Dockerfile and CI pipeline for the microservice',
    preferredCapability: 'code',
    expectedPrimaryCli: 'claude',
    acceptableModels: ['claude-sonnet', 'gemini-pro', 'codex-5.3'],
  },
  {
    category: 'exploration',
    task: 'Explore the codebase and find all API endpoints',
    preferredCapability: 'context',
    expectedPrimaryCli: 'gemini',
    acceptableModels: ['gemini-pro', 'gemini-flash', 'claude-sonnet'],
  },
];

// ============================================================================
// delegate_to_model responses
// ============================================================================

export const MOCK_DELEGATE_ARCHITECTURE: DelegateResponse = {
  recommended_model: 'claude-opus',
  reasoning:
    'Selected claude-opus for architecture task: strong reasoning, plan billing',
  capabilities: {
    reasoning: 10,
    contextWindow: 200000,
    codeGeneration: 9,
    speed: 5,
    cost: 10,
  },
  estimated_tokens: 30,
  alternatives: [
    { model: 'claude-sonnet', score: 66, tradeoff: 'faster but less capable' },
    { model: 'gemini-pro', score: 55, tradeoff: 'cheaper but less capable' },
  ],
};

export const MOCK_DELEGATE_CODE: DelegateResponse = {
  recommended_model: 'codex-5.3',
  reasoning:
    'Selected codex-5.3 for code generation: strong code, testing task',
  capabilities: {
    reasoning: 10,
    contextWindow: 400000,
    codeGeneration: 10,
    speed: 7,
    cost: 5,
  },
  estimated_tokens: 22,
  alternatives: [
    { model: 'codex-5.2', score: 77, tradeoff: 'faster but less capable' },
    { model: 'claude-sonnet', score: 66, tradeoff: 'cheaper but less capable' },
  ],
};

export const MOCK_DELEGATE_RESEARCH: DelegateResponse = {
  recommended_model: 'gemini-pro',
  reasoning:
    'Selected gemini-pro for research: strong context window, research task',
  capabilities: {
    reasoning: 8,
    contextWindow: 2000000,
    codeGeneration: 7,
    speed: 7,
    cost: 3,
  },
  estimated_tokens: 25,
  alternatives: [
    { model: 'gemini-flash', score: 60, tradeoff: 'faster but less capable' },
    { model: 'claude-sonnet', score: 55, tradeoff: 'smaller context' },
  ],
};

export const MOCK_DELEGATE_WRONG: DelegateResponse = {
  recommended_model: 'gemini-flash',
  reasoning: 'Selected gemini-flash: fast fallback model',
  capabilities: {
    reasoning: 6,
    contextWindow: 1000000,
    codeGeneration: 6,
    speed: 10,
    cost: 2,
  },
  estimated_tokens: 15,
  alternatives: [],
};

// ============================================================================
// weather_report responses
// ============================================================================

export const MOCK_WEATHER_HEALTHY: WeatherResponse = {
  overall: { totalTasks: 50, successRate: 0.92, avgDurationMs: 3500 },
  cliWeather: [
    {
      cli: 'claude',
      totalTasks: 20,
      successRate: 0.95,
      avgDurationMs: 4000,
      byCategory: {
        architecture: { count: 8, successRate: 1.0, avgDurationMs: 5000 },
        security_review: { count: 6, successRate: 0.83, avgDurationMs: 4500 },
        planning: { count: 6, successRate: 1.0, avgDurationMs: 3000 },
      },
    },
    {
      cli: 'codex',
      totalTasks: 18,
      successRate: 0.89,
      avgDurationMs: 3000,
      byCategory: {
        code_generation: { count: 10, successRate: 0.9, avgDurationMs: 2500 },
        testing: { count: 5, successRate: 0.8, avgDurationMs: 3500 },
        code_review: { count: 3, successRate: 1.0, avgDurationMs: 3000 },
      },
    },
    {
      cli: 'gemini',
      totalTasks: 12,
      successRate: 0.92,
      avgDurationMs: 3500,
      byCategory: {
        research: { count: 5, successRate: 1.0, avgDurationMs: 4000 },
        documentation: { count: 4, successRate: 0.75, avgDurationMs: 3000 },
        exploration: { count: 3, successRate: 1.0, avgDurationMs: 3500 },
      },
    },
  ],
  adaptiveBonuses: [
    {
      cli: 'claude',
      category: 'architecture',
      staticBonus: 15,
      adaptiveBonus: 3,
      sampleCount: 8,
      sufficient: false,
    },
    {
      cli: 'codex',
      category: 'code_generation',
      staticBonus: 15,
      adaptiveBonus: 2,
      sampleCount: 10,
      sufficient: true,
    },
  ],
  tierRecommendations: [],
  learningInsights: [
    {
      cli: 'claude',
      category: 'architecture',
      trend: 'improving',
      confidence: 0.7,
    },
  ],
  recommendedMappings: [
    {
      category: 'architecture',
      recommendedCli: 'claude',
      successRate: 1.0,
      sampleCount: 8,
      confidence: 'medium',
    },
    {
      category: 'code_generation',
      recommendedCli: 'codex',
      successRate: 0.9,
      sampleCount: 10,
      confidence: 'high',
    },
  ],
  explorationRate: 0.1,
  coldStartThreshold: 10,
  collectedAt: '2026-02-14T12:00:00Z',
};

export const MOCK_WEATHER_COLD: WeatherResponse = {
  overall: { totalTasks: 0, successRate: 0, avgDurationMs: 0 },
  cliWeather: [],
  adaptiveBonuses: [],
  tierRecommendations: [],
  explorationRate: 0.1,
  coldStartThreshold: 10,
  collectedAt: '2026-02-14T12:00:00Z',
};

// ============================================================================
// consensus_vote responses
// ============================================================================

export const MOCK_VOTE_APPROVED: VoteResponse = {
  proposal: 'Routing quality is acceptable',
  strategy: 'simple_majority',
  decision: 'approved',
  approvalPercentage: 100,
  voteCounts: { approve: 3, reject: 0, abstain: 0, error: 0 },
  votes: [
    {
      role: 'Software Architect',
      decision: 'approve',
      confidence: 0.9,
      reasoning: 'Routing decisions match expected mappings.',
      simulated: false,
      error: false,
    },
    {
      role: 'Security Engineer',
      decision: 'approve',
      confidence: 0.85,
      reasoning: 'Security tasks correctly routed to claude.',
      simulated: false,
      error: false,
    },
    {
      role: 'Developer Experience',
      decision: 'approve',
      confidence: 0.88,
      reasoning: 'Code tasks routed to codex as expected.',
      simulated: false,
      error: false,
    },
  ],
  durationMs: 15000,
  simulateVotes: false,
};

export const MOCK_VOTE_REJECTED: VoteResponse = {
  proposal: 'Routing quality is acceptable',
  strategy: 'supermajority',
  decision: 'rejected',
  approvalPercentage: 33.33,
  voteCounts: { approve: 1, reject: 2, abstain: 0, error: 0 },
  votes: [
    {
      role: 'Software Architect',
      decision: 'reject',
      confidence: 0.8,
      reasoning: 'Too many misrouted tasks.',
      simulated: false,
      error: false,
    },
    {
      role: 'Security Engineer',
      decision: 'reject',
      confidence: 0.9,
      reasoning: 'Security tasks misrouted to gemini.',
      simulated: false,
      error: false,
    },
    {
      role: 'Developer Experience',
      decision: 'approve',
      confidence: 0.6,
      reasoning: 'Code routing acceptable.',
      simulated: false,
      error: false,
    },
  ],
  durationMs: 12000,
  simulateVotes: false,
};
