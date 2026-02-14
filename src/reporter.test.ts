/**
 * Reporter tests — formatting validation results.
 */

import { describe, it, expect } from 'vitest';
import { generateReport } from './reporter.js';
import type { OracleReport } from './types.js';
import {
  MOCK_WEATHER_HEALTHY,
  MOCK_VOTE_APPROVED,
} from './fixtures/mock-responses.js';

const SAMPLE_REPORT: OracleReport = {
  validations: [
    {
      category: 'architecture',
      recommended: 'claude-opus',
      expected: 'claude',
      correct: true,
      reasoning: 'Good architecture routing',
      alternatives: ['claude-sonnet'],
    },
    {
      category: 'code_generation',
      recommended: 'gemini-flash',
      expected: 'codex',
      correct: false,
      reasoning: 'Wrong model selected',
      alternatives: [],
    },
  ],
  accuracy: 0.5,
  weather: MOCK_WEATHER_HEALTHY,
  voteResult: MOCK_VOTE_APPROVED,
};

describe('generateReport', () => {
  it('generates markdown by default', () => {
    const report = generateReport(SAMPLE_REPORT);
    expect(report).toContain('# Routing Oracle Report');
    expect(report).toContain('**Accuracy:** 50%');
    expect(report).toContain('PASS');
    expect(report).toContain('FAIL');
  });

  it('includes misrouted section in markdown', () => {
    const report = generateReport(SAMPLE_REPORT, 'markdown');
    expect(report).toContain('## Misrouted Categories');
    expect(report).toContain('code_generation');
    expect(report).toContain('gemini-flash');
  });

  it('includes weather context', () => {
    const report = generateReport(SAMPLE_REPORT, 'markdown');
    expect(report).toContain('## Weather Context');
    expect(report).toContain('Total tasks: 50');
  });

  it('includes vote result', () => {
    const report = generateReport(SAMPLE_REPORT, 'markdown');
    expect(report).toContain('## Quality Vote');
    expect(report).toContain('approved');
  });

  it('generates valid JSON', () => {
    const report = generateReport(SAMPLE_REPORT, 'json');
    const parsed = JSON.parse(report) as OracleReport;
    expect(parsed.accuracy).toBe(0.5);
    expect(parsed.validations.length).toBe(2);
  });

  it('generates text format', () => {
    const report = generateReport(SAMPLE_REPORT, 'text');
    expect(report).toContain('[PASS] architecture');
    expect(report).toContain('[FAIL] code_generation');
    expect(report).toContain('Vote: approved');
  });

  it('omits weather section when null', () => {
    const noWeather: OracleReport = { ...SAMPLE_REPORT, weather: null };
    const report = generateReport(noWeather, 'markdown');
    expect(report).not.toContain('## Weather Context');
  });

  it('omits vote section when null', () => {
    const noVote: OracleReport = { ...SAMPLE_REPORT, voteResult: null };
    const report = generateReport(noVote, 'markdown');
    expect(report).not.toContain('## Quality Vote');
  });
});
