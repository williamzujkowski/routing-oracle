/**
 * Oracle report formatter.
 *
 * Generates human-readable summaries of routing validation results.
 */

import type { OracleReport, RoutingValidation } from './types.js';

export type ReportFormat = 'markdown' | 'json' | 'text';

/** Generate a formatted report from oracle results. */
export function generateReport(
  report: OracleReport,
  format: ReportFormat = 'markdown'
): string {
  if (format === 'json') return JSON.stringify(report, null, 2);
  if (format === 'text') return generateTextReport(report);
  return generateMarkdownReport(report);
}

function generateMarkdownReport(report: OracleReport): string {
  const lines: string[] = ['# Routing Oracle Report', ''];

  lines.push(
    `**Accuracy:** ${Math.round(report.accuracy * 100)}% ` +
      `(${report.validations.filter((v) => v.correct).length}/${report.validations.length})`
  );
  lines.push('');

  lines.push('## Routing Results', '');
  lines.push('| Category | Model | Expected CLI | Status |');
  lines.push('|----------|-------|-------------|--------|');
  for (const v of report.validations) {
    const icon = v.correct ? 'PASS' : 'FAIL';
    lines.push(`| ${v.category} | ${v.recommended} | ${v.expected} | ${icon} |`);
  }
  lines.push('');

  const misrouted = report.validations.filter((v) => !v.correct);
  if (misrouted.length > 0) {
    lines.push('## Misrouted Categories', '');
    for (const v of misrouted) {
      lines.push(`- **${v.category}**: got \`${v.recommended}\`, expected \`${v.expected}\``);
      lines.push(`  Reasoning: ${v.reasoning}`);
    }
    lines.push('');
  }

  if (report.weather !== null) {
    lines.push('## Weather Context', '');
    lines.push(`- Total tasks: ${report.weather.overall.totalTasks}`);
    lines.push(`- Overall success: ${Math.round(report.weather.overall.successRate * 100)}%`);
    lines.push(`- CLIs reporting: ${report.weather.cliWeather.length}`);
    lines.push('');
  }

  if (report.voteResult !== null) {
    lines.push('## Quality Vote', '');
    lines.push(`- Decision: **${report.voteResult.decision}**`);
    lines.push(`- Approval: ${report.voteResult.approvalPercentage}%`);
    lines.push(`- Strategy: ${report.voteResult.strategy}`);
    lines.push('');
  }

  return lines.join('\n');
}

function generateTextReport(report: OracleReport): string {
  const lines: string[] = [];
  lines.push(`Routing Oracle: ${Math.round(report.accuracy * 100)}% accuracy`);
  lines.push('');

  for (const v of report.validations) {
    lines.push(formatValidationLine(v));
  }

  if (report.voteResult !== null) {
    lines.push('');
    lines.push(`Vote: ${report.voteResult.decision} (${report.voteResult.approvalPercentage}%)`);
  }

  return lines.join('\n');
}

function formatValidationLine(v: RoutingValidation): string {
  const status = v.correct ? '[PASS]' : '[FAIL]';
  return `${status} ${v.category}: ${v.recommended} (expected: ${v.expected})`;
}
