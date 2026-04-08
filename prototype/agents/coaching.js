import { streamChat } from '../api/claude.js';

const SYSTEM = `You are the Campaign Performance & Coaching Agent for Novartis WEC.
Your job: analyze campaign KPIs across the cluster, identify what's working and what isn't, generate a coaching note for the marketing manager, and produce next week's adjusted plan.

Rules:
- Be specific: cite actual numbers, channel names, and campaign names from the data.
- Identify the ROOT CAUSE of underperformance (not just the symptom).
- Coaching note should be actionable — the manager should know exactly what to do tomorrow morning.
- Next week's plan should be concrete: which channels to boost, which to pause, what to test.
- Format output as clean markdown:
  ## Campaign Performance Summary — W14 2026
  ### What's working (keep & scale)
  ### What's underperforming (diagnose & fix)
  ### Root cause analysis
  ## Coaching Note to Marketing Manager
  [Addressed to manager, specific and direct]
  ## Next Week Adjusted Plan (W15)
  ### Channel actions
  ### Content actions
  ### Team focus areas
  ## KPI targets for W15`;

export async function runCoachingAgent({ campaigns }, { onStep, onToken, onDone, onError }) {
  onStep?.({ id: 'kpis', label: 'Pulling campaign KPIs', detail: `${campaigns.campaigns.length} campaigns analyzed`, status: 'done' });
  onStep?.({ id: 'channels', label: 'Scoring channel performance', detail: 'Email, webinar, field, digital', status: 'done' });
  onStep?.({ id: 'diagnose', label: 'Diagnosing underperforming campaigns', status: 'done' });
  onStep?.({ id: 'generate', label: 'Generating coaching note & adjusted plan', status: 'active' });

  const context = `
REPORTING WEEK: ${campaigns.reporting_week}
CLUSTER: ${campaigns.cluster}

CLUSTER SUMMARY:
${JSON.stringify(campaigns.cluster_summary, null, 2)}

DETAILED CAMPAIGN DATA:
${campaigns.campaigns.map(c => `
=== ${c.name} (${c.status}) ===
Brand: ${c.brand} | Country: ${c.country} | TA: ${c.therapeutic_area}
Audience: ${c.audience}

Channel Performance:
${Object.entries(c.channels).map(([ch, data]) => {
  const lines = [`  ${ch.toUpperCase()}: status=${data.status}`];
  if (data.open_rate !== undefined) lines.push(`    open_rate=${(data.open_rate * 100).toFixed(0)}% (target ${(data.target_open_rate * 100).toFixed(0)}%)`);
  if (data.click_rate !== undefined) lines.push(`    click_rate=${(data.click_rate * 100).toFixed(0)}% (target ${(data.target_click_rate * 100).toFixed(0)}%)`);
  if (data.completion_rate !== undefined) lines.push(`    completion_rate=${(data.completion_rate * 100).toFixed(0)}% (target ${(data.target_completion_rate * 100).toFixed(0)}%)`);
  if (data.registration_rate !== undefined) lines.push(`    registration_rate=${(data.registration_rate * 100).toFixed(0)}% (target ${(data.target_registration_rate * 100).toFixed(0)}%)`);
  return lines.join('\n');
}).join('\n')}

Overall KPIs: ${JSON.stringify(c.overall_kpis)}
Manager notes: ${c.manager_notes}
`).join('\n')}
`;

  await streamChat({
    system: SYSTEM,
    messages: [{ role: 'user', content: context }],
    onToken: (t) => { onStep?.({ id: 'generate', status: 'streaming' }); onToken?.(t); },
    onDone: () => { onStep?.({ id: 'generate', status: 'done' }); onDone?.(); },
    onError,
  });
}
