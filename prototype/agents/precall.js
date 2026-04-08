import { streamChat } from '../api/claude.js';

const SYSTEM = `You are the Rep Pre-Call Intelligence Agent for Novartis WEC.
Your job: given an upcoming HCP visit, synthesize CRM history, digital engagement data, and HCP profile to generate a sharp pre-call briefing card with specific talking points.

Rules:
- Identify prescribing trends and flag any decline with context.
- Prioritize open action items from previous visits.
- Only suggest topics that are grounded in the HCP's known interests — never generic.
- Note what NOT to do (e.g., topics the HCP dislikes).
- Format output as clean markdown:
  ## Pre-Call Brief: [HCP Name] — [Date & Time]
  ### HCP snapshot
  ### What's happened since the last visit
  ### Prescribing trend analysis
  ### Recommended talking points (max 3, prioritized)
  ### What NOT to do
  ### Suggested follow-up action`;

export async function runPrecallAgent({ hcpProfile, crm, repName = 'Marc Huber', visitTime = '11:00 AM' }, { onStep, onToken, onDone, onError }) {
  onStep?.({ id: 'crm', label: 'Pulling CRM history', detail: `${crm.last_interactions.length} interactions found`, status: 'done' });
  onStep?.({ id: 'digital', label: 'Checking digital engagement', detail: `${crm.digital_engagement.length} touchpoints retrieved`, status: 'done' });
  onStep?.({ id: 'rx', label: 'Analyzing prescribing trend', detail: 'Last 5 months of Rx data', status: 'done' });
  onStep?.({ id: 'generate', label: 'Generating pre-call briefing', status: 'active' });

  const context = `
REP: ${repName}
VISIT: ${hcpProfile.name} at ${hcpProfile.institution}, ${visitTime} today

HCP PROFILE:
${JSON.stringify(hcpProfile, null, 2)}

CRM — LAST INTERACTIONS:
${crm.last_interactions.map(i => `
Date: ${i.date} | Type: ${i.type}
Topic: ${i.topic}
Outcome: ${i.outcome}
Next action committed: ${i.next_action}
`).join('\n---\n')}

OPEN ACTION ITEMS (from last visit notes):
${crm.open_action_items.map((a, i) => `${i + 1}. ${a}`).join('\n')}

DIGITAL ENGAGEMENT (recent):
${crm.digital_engagement.map(d => `- ${d.date}: ${d.channel} — ${d.asset} → ${d.action} (${d.time_on_asset_sec}s on content)`).join('\n')}

PRESCRIBING TREND (Entresto):
${crm.prescribing_trend.map(p => `${p.month}: ${p.entresto_rx} Rx`).join(' | ')}

VISIT OBJECTIVE: ${crm.visit_objective}
`;

  await streamChat({
    system: SYSTEM,
    messages: [{ role: 'user', content: context }],
    onToken: (t) => { onStep?.({ id: 'generate', status: 'streaming' }); onToken?.(t); },
    onDone: () => { onStep?.({ id: 'generate', status: 'done' }); onDone?.(); },
    onError,
  });
}
