import { runBriefingAgent } from './agents/briefing.js';
import { runPrecallAgent } from './agents/precall.js';
import { runContentMLRAgent } from './agents/content_mlr.js';
import { runCoachingAgent } from './agents/coaching.js';

// ── Load mock data ──
async function loadJSON(path) {
  const r = await fetch(path);
  return r.json();
}

const [emails, crm, campaigns, hcpProfiles] = await Promise.all([
  loadJSON('./mock_data/emails.json'),
  loadJSON('./mock_data/crm.json'),
  loadJSON('./mock_data/campaigns.json'),
  loadJSON('./mock_data/hcp_profiles.json'),
]);

// ── Navigation ──
const navItems = document.querySelectorAll('.agent-nav-item');
const views = document.querySelectorAll('.agent-view');

navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    navItems.forEach(b => b.classList.remove('active'));
    views.forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`view-${btn.dataset.agent}`).classList.add('active');
  });
});

// ── Shared helpers ──

function setTag(id, state, label) {
  const el = document.getElementById(`tag-${id}`);
  el.className = `output-tag ${state}`;
  el.textContent = label;
}

function setBadge(id, state) {
  const el = document.getElementById(`badge-${id}`);
  el.className = `agent-badge ${state}`;
}

function setStep(listId, stepData) {
  const list = document.getElementById(`steplist-${listId}`);
  const el = list.querySelector(`[data-step="${stepData.id}"]`);
  if (!el) return;
  el.className = `step ${stepData.status}`;
  if (stepData.detail) {
    let detail = el.querySelector('.step-detail');
    if (!detail) {
      detail = document.createElement('div');
      detail.className = 'step-detail';
      el.appendChild(detail);
    }
    detail.textContent = stepData.detail;
  }
}

let rawText = {};

function startOutput(agentId) {
  rawText[agentId] = '';
  const el = document.getElementById(`output-${agentId}`);
  el.classList.remove('idle-output');
  el.innerHTML = '';
}

function appendToken(agentId, token) {
  rawText[agentId] += token;
  const el = document.getElementById(`output-${agentId}`);
  el.innerHTML = marked.parse(rawText[agentId]);
  el.scrollTop = el.scrollHeight;
}

function lockBtn(id) {
  const btn = document.getElementById(`run-${id}`);
  btn.disabled = true;
  btn.innerHTML = '<span class="run-icon">◎</span> Running…';
}

function unlockBtn(id, success = true) {
  const btn = document.getElementById(`run-${id}`);
  btn.disabled = false;
  btn.innerHTML = '<span class="run-icon">▶</span> Run Again';
}

function resetSteps(listId) {
  document.querySelectorAll(`#steplist-${listId} .step`).forEach(s => {
    s.className = 'step idle';
    const detail = s.querySelector('.step-detail');
    if (detail) detail.remove();
  });
}

// ── Agent 1: Morning Briefing ──
document.getElementById('run-briefing').addEventListener('click', async () => {
  lockBtn('briefing');
  setBadge('briefing', 'running');
  setTag('briefing', 'running', 'Running…');
  resetSteps('briefing');
  startOutput('briefing');

  await runBriefingAgent(
    { emails, campaigns, userName: 'Sophie' },
    {
      onStep: (s) => setStep('briefing', s),
      onToken: (t) => appendToken('briefing', t),
      onDone: () => {
        setTag('briefing', 'done', 'Complete');
        setBadge('briefing', 'done');
        unlockBtn('briefing');
      },
      onError: (e) => {
        setTag('briefing', 'error', 'Error');
        appendToken('briefing', `\n\n> **Error:** ${e}`);
        unlockBtn('briefing', false);
      },
    }
  );
});

// ── Agent 2: Pre-Call ──
document.getElementById('run-precall').addEventListener('click', async () => {
  lockBtn('precall');
  setBadge('precall', 'running');
  setTag('precall', 'running', 'Running…');
  resetSteps('precall');
  startOutput('precall');

  await runPrecallAgent(
    { hcpProfile: hcpProfiles.dr_muller_anna, crm, repName: 'Marc Huber', visitTime: '11:00 AM' },
    {
      onStep: (s) => setStep('precall', s),
      onToken: (t) => appendToken('precall', t),
      onDone: () => {
        setTag('precall', 'done', 'Complete');
        setBadge('precall', 'done');
        unlockBtn('precall');
      },
      onError: (e) => {
        setTag('precall', 'error', 'Error');
        appendToken('precall', `\n\n> **Error:** ${e}`);
        unlockBtn('precall', false);
      },
    }
  );
});

// ── Agent 3: Content + MLR ──
document.getElementById('run-content').addEventListener('click', async () => {
  const brief = document.getElementById('content-brief').value;
  lockBtn('content');
  setBadge('content', 'running');
  setTag('content', 'running', 'Running loop…');
  resetSteps('content');
  startOutput('content');

  await runContentMLRAgent(
    { brief },
    {
      onStep: (s) => setStep('content', s),
      onToken: (t) => appendToken('content', t),
      onDone: () => {
        setTag('content', 'done', 'Loop complete');
        setBadge('content', 'done');
        unlockBtn('content');
      },
      onError: (e) => {
        setTag('content', 'error', 'Error');
        appendToken('content', `\n\n> **Error:** ${e}`);
        unlockBtn('content', false);
      },
    }
  );
});

// ── Agent 4: Coaching ──
document.getElementById('run-coaching').addEventListener('click', async () => {
  lockBtn('coaching');
  setBadge('coaching', 'running');
  setTag('coaching', 'running', 'Running…');
  resetSteps('coaching');
  startOutput('coaching');

  await runCoachingAgent(
    { campaigns },
    {
      onStep: (s) => setStep('coaching', s),
      onToken: (t) => appendToken('coaching', t),
      onDone: () => {
        setTag('coaching', 'done', 'Complete');
        setBadge('coaching', 'done');
        unlockBtn('coaching');
      },
      onError: (e) => {
        setTag('coaching', 'error', 'Error');
        appendToken('coaching', `\n\n> **Error:** ${e}`);
        unlockBtn('coaching', false);
      },
    }
  );
});
