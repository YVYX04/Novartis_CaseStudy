import { streamChat } from '../api/claude.js';

const SYSTEM = `You are the Morning Briefing Agent for Novartis WEC (Western European Cluster).
Your job: analyze the inbox, flag urgent items, identify today's campaign deadlines, and produce a crisp, structured morning briefing card.

Rules:
- Be concise and specific. Use real names, countries, and metrics from the data.
- Urgency flags must have a clear reason and a suggested first action.
- Format your output as clean markdown with these sections:
  ## Good morning, [user] — here's your 60-second briefing
  ### Urgent (action needed today)
  ### Today's campaign deadlines
  ### FYI (no immediate action)
  ### Recommended first move
- Keep each bullet to one line. No filler. No greetings beyond the header.`;

export async function runBriefingAgent({ emails, campaigns, userName = 'Sophie' }, { onStep, onToken, onDone, onError }) {
  onStep?.({ id: 'inbox', label: 'Reading inbox', detail: `${emails.length} emails retrieved`, status: 'done' });
  onStep?.({ id: 'deadlines', label: 'Checking campaign deadlines', detail: `${campaigns.campaigns.length} active campaigns`, status: 'done' });
  onStep?.({ id: 'urgency', label: 'Analyzing urgency flags', detail: 'Scoring by priority and deadline', status: 'done' });
  onStep?.({ id: 'generate', label: 'Generating morning briefing', status: 'active' });

  const context = `
USER: ${userName}
TIME: 08:00 CET, Tuesday April 8 2026

INBOX (${emails.length} emails overnight):
${emails.map((e, i) => `
[${i + 1}] FROM: ${e.from_name} (${e.role})
SUBJECT: ${e.subject}
RECEIVED: ${e.received}
PRIORITY: ${e.priority}
BODY: ${e.body}
TAGS: ${e.tags.join(', ')}
`).join('\n---\n')}

CAMPAIGN STATUS SUMMARY:
${JSON.stringify(campaigns.cluster_summary, null, 2)}

CAMPAIGNS WITH ISSUES:
${campaigns.campaigns.filter(c => c.status !== 'On Track').map(c =>
  `- ${c.name} (${c.status}): ${c.manager_notes}`
).join('\n')}

TODAY'S HARD DEADLINES (from campaign tracker email):
- Entresto Netherlands email — final copy approval by 12:00
- Austria digital banner — translation review by 15:00
- Cosentyx Belgium revised channel plan — due tomorrow
`;

  await streamChat({
    system: SYSTEM,
    messages: [{ role: 'user', content: context }],
    onToken: (t) => { onStep?.({ id: 'generate', status: 'streaming' }); onToken?.(t); },
    onDone: () => { onStep?.({ id: 'generate', status: 'done' }); onDone?.(); },
    onError,
  });
}
