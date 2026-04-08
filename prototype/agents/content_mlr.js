import { streamChat } from '../api/claude.js';

const CONTENT_SYSTEM = `You are a pharmaceutical marketing copywriter for Novartis Switzerland.
Write a compliant HCP email for the given campaign brief. The email should:
- Be professional, data-driven, and science-led (not promotional in tone)
- Include one clear call-to-action
- Be written in English (for demo; country version would be in local language)
- Include a placeholder for the approved disclaimer: [DISCLAIMER]
- Reference only approved data points provided in the brief
- Max 200 words in the email body

Format:
**SUBJECT LINE:** [subject]

**EMAIL BODY:**
[body]

[DISCLAIMER]`;

const MLR_SYSTEM = `You are a strict pharmaceutical MLR (Medical-Legal-Regulatory) compliance reviewer for Novartis.
Review the draft email for the following violations. For each issue found, be specific about the exact phrase.

Check for:
1. Off-label claims (claims outside the approved indication)
2. Superlative or absolute language ("best", "most effective", "always", "never") without citation
3. Missing or incomplete safety information references
4. Unapproved efficacy claims (any efficacy claim not backed by a cited study)
5. Missing [DISCLAIMER] placeholder
6. Direct comparative claims against competitors without head-to-head RCT support
7. Promotional tone that doesn't match HCP audience standards

Format your response EXACTLY as:
**MLR VERDICT:** [PASS / FAIL]
**Issues found:** [number, or "None"]
**Detailed findings:**
[list each issue with the exact phrase and which rule it violates]
**Required changes:**
[specific rewrite instructions for each issue, or "None required"]`;

const REVISION_SYSTEM = `You are a pharmaceutical marketing copywriter for Novartis Switzerland.
You have received MLR feedback on a draft email. Revise the email to fix ALL the issues flagged.
Keep the same structure and intent, but ensure every fix is implemented precisely.
Return the full revised email in the same format:

**SUBJECT LINE:** [subject]
**EMAIL BODY:**
[revised body]
[DISCLAIMER]`;

export async function runContentMLRAgent({ brief }, { onStep, onToken, onDone, onError }) {
  let fullOutput = '';
  const appendOutput = (text) => { fullOutput += text; onToken?.(text); };

  // Step 1 — Generate content
  onStep?.({ id: 'brief', label: 'Reading campaign brief', status: 'done' });
  onStep?.({ id: 'generate', label: 'Generating email content', status: 'active' });

  let draftEmail = '';
  await streamChat({
    system: CONTENT_SYSTEM,
    messages: [{ role: 'user', content: `Campaign brief:\n${brief}` }],
    onToken: (t) => {
      draftEmail += t;
      onStep?.({ id: 'generate', status: 'streaming' });
      appendOutput(t);
    },
    onDone: () => onStep?.({ id: 'generate', status: 'done' }),
    onError,
  });

  // Step 2 — MLR check
  onStep?.({ id: 'mlr', label: 'Running MLR compliance check', detail: 'Checking 7 regulatory rules', status: 'active' });
  appendOutput('\n\n---\n## MLR Compliance Check\n\n');

  let mlrVerdict = '';
  await streamChat({
    system: MLR_SYSTEM,
    messages: [{ role: 'user', content: `Please review this draft email:\n\n${draftEmail}` }],
    onToken: (t) => {
      mlrVerdict += t;
      onStep?.({ id: 'mlr', status: 'streaming' });
      appendOutput(t);
    },
    onDone: () => onStep?.({ id: 'mlr', status: 'done' }),
    onError,
  });

  const passed = mlrVerdict.includes('PASS') && !mlrVerdict.includes('FAIL');

  if (passed) {
    onStep?.({ id: 'final', label: 'Content approved — ready for deployment', status: 'done' });
    appendOutput('\n\n---\n> **Agent decision:** Content passed MLR check. No revision required.');
    onDone?.();
    return;
  }

  // Step 3 — Revise if failed
  onStep?.({ id: 'revise', label: 'Revising content based on MLR feedback', status: 'active' });
  appendOutput('\n\n---\n## Revised Email (Post-MLR)\n\n');

  let revisedEmail = '';
  await streamChat({
    system: REVISION_SYSTEM,
    messages: [
      { role: 'user', content: `Original draft:\n${draftEmail}\n\nMLR feedback:\n${mlrVerdict}\n\nPlease revise to fix all issues.` }
    ],
    onToken: (t) => {
      revisedEmail += t;
      onStep?.({ id: 'revise', status: 'streaming' });
      appendOutput(t);
    },
    onDone: () => onStep?.({ id: 'revise', status: 'done' }),
    onError,
  });

  // Step 4 — Final MLR re-check
  onStep?.({ id: 'recheck', label: 'Re-running MLR check on revised content', status: 'active' });
  appendOutput('\n\n---\n## Final MLR Re-Check\n\n');

  await streamChat({
    system: MLR_SYSTEM,
    messages: [{ role: 'user', content: `Please review this REVISED email:\n\n${revisedEmail}` }],
    onToken: (t) => {
      onStep?.({ id: 'recheck', status: 'streaming' });
      appendOutput(t);
    },
    onDone: () => {
      onStep?.({ id: 'recheck', status: 'done' });
      onStep?.({ id: 'final', label: 'MLR loop complete — content cleared for local review', status: 'done' });
      appendOutput('\n\n---\n> **Agent decision:** Revision loop complete. Revised content ready for local country MLR sign-off.');
      onDone?.();
    },
    onError,
  });
}
