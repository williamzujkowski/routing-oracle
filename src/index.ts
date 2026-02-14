/**
 * routing-oracle — Multi-model routing validator
 *
 * Chains: delegate_to_model → weather_report → consensus_vote
 */

export type { ToolCaller } from './oracle-pipeline.js';
export {
  routeAndValidate,
  fetchWeather,
  voteOnQuality,
  computeAccuracy,
  getMisrouted,
  weatherConfirms,
  runOraclePipeline,
} from './oracle-pipeline.js';
export { generateReport } from './reporter.js';
export type { ReportFormat } from './reporter.js';
export type {
  DelegateInput,
  DelegateResponse,
  WeatherResponse,
  VoteResponse,
  RoutingExpectation,
  RoutingValidation,
  OracleReport,
  OracleConfig,
  TaskCategory,
  VotingStrategy,
} from './types.js';
export {
  DelegateInputSchema,
  DelegateResponseSchema,
  WeatherInputSchema,
  WeatherResponseSchema,
  VoteInputSchema,
  VoteResponseSchema,
  CapabilitiesSchema,
  AlternativeSchema,
} from './types.js';
