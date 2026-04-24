import { runBriefingAgent }    from './agents/briefing.js';
import { runPrecallAgent }      from './agents/precall.js';
import { runContentMLRAgent }   from './agents/content_mlr.js';
import { runCoachingAgent }     from './agents/coaching.js';

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

// ── Live clock + greeting ──
function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const el   = document.getElementById('live-clock');
  if (el) el.textContent = `${h}:${m}`;
}

function setGreeting() {
  const hour = new Date().getHours();
  const text = hour < 12 ? 'Good morning, Mary.'
             : hour < 18 ? 'Good afternoon, Mary.'
             :              'Good evening, Mary.';
  const el = document.getElementById('greeting-text');
  if (el) el.textContent = text;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now    = new Date();
  const dateEl = document.getElementById('greeting-date');
  if (dateEl) dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

updateClock();
setGreeting();
setInterval(updateClock, 30_000);

// ── Page navigation ──
const dashboard  = document.getElementById('dashboard');
const agentPage  = document.getElementById('agent-page');
const agentViews = document.querySelectorAll('.agent-view');

const agentNames = {
  briefing: 'Morning Briefing',
  precall:  'Pre-Call Intel',
  content:  'Content + MLR',
  coaching: 'Performance Coach',
};

function openAgent(agentId) {
  agentViews.forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${agentId}`).classList.add('active');

  const crumb = document.getElementById('breadcrumb-name');
  if (crumb) crumb.textContent = agentNames[agentId] || agentId;

  dashboard.classList.remove('active');
  agentPage.classList.add('active');

  const scroll = agentPage.querySelector('.agent-page-scroll');
  if (scroll) scroll.scrollTop = 0;
}

function openDashboard() {
  agentPage.classList.remove('active');
  dashboard.classList.add('active');
}

// Agent card clicks (whole card + launch button)
document.querySelectorAll('.agent-card').forEach(card => {
  card.addEventListener('click', () => openAgent(card.dataset.agent));
});

document.querySelectorAll('.launch-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    openAgent(btn.closest('.agent-card').dataset.agent);
  });
});

document.getElementById('back-btn').addEventListener('click', openDashboard);

// ── Shared helpers ──
function setTag(id, state, label) {
  const el = document.getElementById(`tag-${id}`);
  if (!el) return;
  el.className = `output-tag ${state}`;
  el.textContent = label;
}

function setBadge(id, state) {
  const el = document.getElementById(`badge-${id}`);
  if (el) el.className = `agent-badge ${state}`;
}

function setStep(listId, stepData) {
  const list = document.getElementById(`steplist-${listId}`);
  const el   = list?.querySelector(`[data-step="${stepData.id}"]`);
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

function unlockBtn(id) {
  const btn = document.getElementById(`run-${id}`);
  btn.disabled = false;
  btn.innerHTML = '<span class="run-icon">▶</span> Run Again';
}

function resetSteps(listId) {
  document.querySelectorAll(`#steplist-${listId} .step`).forEach(s => {
    s.className = 'step idle';
    s.querySelector('.step-detail')?.remove();
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
    { emails, campaigns, userName: 'Mary' },
    {
      onStep:  s => setStep('briefing', s),
      onToken: t => appendToken('briefing', t),
      onDone:  () => { setTag('briefing', 'done', 'Complete'); setBadge('briefing', 'done'); unlockBtn('briefing'); },
      onError: e => { setTag('briefing', 'error', 'Error'); appendToken('briefing', `\n\n> **Error:** ${e}`); unlockBtn('briefing'); },
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
      onStep:  s => setStep('precall', s),
      onToken: t => appendToken('precall', t),
      onDone:  () => { setTag('precall', 'done', 'Complete'); setBadge('precall', 'done'); unlockBtn('precall'); },
      onError: e => { setTag('precall', 'error', 'Error'); appendToken('precall', `\n\n> **Error:** ${e}`); unlockBtn('precall'); },
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
      onStep:  s => setStep('content', s),
      onToken: t => appendToken('content', t),
      onDone:  () => { setTag('content', 'done', 'Loop complete'); setBadge('content', 'done'); unlockBtn('content'); },
      onError: e => { setTag('content', 'error', 'Error'); appendToken('content', `\n\n> **Error:** ${e}`); unlockBtn('content'); },
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
      onStep:  s => setStep('coaching', s),
      onToken: t => appendToken('coaching', t),
      onDone:  () => { setTag('coaching', 'done', 'Complete'); setBadge('coaching', 'done'); unlockBtn('coaching'); },
      onError: e => { setTag('coaching', 'error', 'Error'); appendToken('coaching', `\n\n> **Error:** ${e}`); unlockBtn('coaching'); },
    }
  );
});
