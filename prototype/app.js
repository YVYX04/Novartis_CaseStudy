import { runBriefingAgent }  from './agents/briefing.js';
import { runPrecallAgent }    from './agents/precall.js';
import { runContentMLRAgent } from './agents/content_mlr.js';
import { runCoachingAgent }   from './agents/coaching.js';

// ── Mock data ──
async function loadJSON(path) { const r = await fetch(path); return r.json(); }

const [emails, crm, campaigns, hcpProfiles] = await Promise.all([
  loadJSON('./mock_data/emails.json'),
  loadJSON('./mock_data/crm.json'),
  loadJSON('./mock_data/campaigns.json'),
  loadJSON('./mock_data/hcp_profiles.json'),
]);

// ── Welcome screen ──
let welcomed = false;

function transitionToDashboard() {
  if (welcomed) return;
  welcomed = true;

  const welcome = document.getElementById('welcome');
  welcome.classList.add('exiting');

  setTimeout(() => {
    welcome.style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    initClock();
    setGreeting();
    runCountUps();
  }, 750);
}

// Auto-transition after 5 seconds
setTimeout(transitionToDashboard, 5000);
document.getElementById('w-skip').addEventListener('click', transitionToDashboard);

// ── Clock & greeting ──
function initClock() {
  updateClock();
  setInterval(updateClock, 30_000);
}

function updateClock() {
  const now = new Date();
  const el  = document.getElementById('live-clock');
  if (el) el.textContent =
    `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

function setGreeting() {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning, Mary.'
                 : h < 18 ? 'Good afternoon, Mary.'
                 :           'Good evening, Mary.';
  const gEl = document.getElementById('greeting-text');
  if (gEl) gEl.textContent = greeting;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];
  const now  = new Date();
  const dEl  = document.getElementById('greeting-date');
  if (dEl) dEl.textContent =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ── Stat count-up animations ──
function countUp(el, target, duration = 1100) {
  let v = 0;
  const step = target / (duration / 16);
  const t = setInterval(() => {
    v = Math.min(v + step, target);
    el.textContent = Math.ceil(v);
    if (v >= target) clearInterval(t);
  }, 16);
}

function runCountUps() {
  document.querySelectorAll('.stat-value[data-target]').forEach(el => {
    countUp(el, parseInt(el.dataset.target));
  });
}

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

function openAgent(id) {
  agentViews.forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${id}`).classList.add('active');
  const crumb = document.getElementById('breadcrumb-name');
  if (crumb) crumb.textContent = agentNames[id] || id;
  dashboard.classList.remove('active');
  agentPage.classList.add('active');
  agentPage.querySelector('.agent-page-scroll').scrollTop = 0;
}

function openDashboard() {
  agentPage.classList.remove('active');
  dashboard.classList.add('active');
}

document.querySelectorAll('.agent-card').forEach(card =>
  card.addEventListener('click', () => openAgent(card.dataset.agent))
);
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
  const el = document.getElementById(`steplist-${listId}`)
    ?.querySelector(`[data-step="${stepData.id}"]`);
  if (!el) return;
  el.className = `step ${stepData.status}`;
  if (stepData.detail) {
    let d = el.querySelector('.step-detail');
    if (!d) { d = document.createElement('div'); d.className = 'step-detail'; el.appendChild(d); }
    d.textContent = stepData.detail;
  }
}

let rawText = {};
function startOutput(id) {
  rawText[id] = '';
  const el = document.getElementById(`output-${id}`);
  el.classList.remove('idle-output');
  el.innerHTML = '';
}
function appendToken(id, token) {
  rawText[id] += token;
  const el = document.getElementById(`output-${id}`);
  el.innerHTML = marked.parse(rawText[id]);
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

// ── Agent 1 ──
document.getElementById('run-briefing').addEventListener('click', async () => {
  lockBtn('briefing'); setBadge('briefing','running');
  setTag('briefing','running','Running…'); resetSteps('briefing'); startOutput('briefing');
  await runBriefingAgent({ emails, campaigns, userName: 'Mary' }, {
    onStep:  s => setStep('briefing', s),
    onToken: t => appendToken('briefing', t),
    onDone:  () => { setTag('briefing','done','Complete'); setBadge('briefing','done'); unlockBtn('briefing'); },
    onError: e => { setTag('briefing','error','Error'); appendToken('briefing',`\n\n> **Error:** ${e}`); unlockBtn('briefing'); },
  });
});

// ── Agent 2 ──
document.getElementById('run-precall').addEventListener('click', async () => {
  lockBtn('precall'); setBadge('precall','running');
  setTag('precall','running','Running…'); resetSteps('precall'); startOutput('precall');
  await runPrecallAgent({ hcpProfile: hcpProfiles.dr_muller_anna, crm, repName: 'Marc Huber', visitTime: '11:00 AM' }, {
    onStep:  s => setStep('precall', s),
    onToken: t => appendToken('precall', t),
    onDone:  () => { setTag('precall','done','Complete'); setBadge('precall','done'); unlockBtn('precall'); },
    onError: e => { setTag('precall','error','Error'); appendToken('precall',`\n\n> **Error:** ${e}`); unlockBtn('precall'); },
  });
});

// ── Agent 3 ──
document.getElementById('run-content').addEventListener('click', async () => {
  const brief = document.getElementById('content-brief').value;
  lockBtn('content'); setBadge('content','running');
  setTag('content','running','Running loop…'); resetSteps('content'); startOutput('content');
  await runContentMLRAgent({ brief }, {
    onStep:  s => setStep('content', s),
    onToken: t => appendToken('content', t),
    onDone:  () => { setTag('content','done','Loop complete'); setBadge('content','done'); unlockBtn('content'); },
    onError: e => { setTag('content','error','Error'); appendToken('content',`\n\n> **Error:** ${e}`); unlockBtn('content'); },
  });
});

// ── Agent 4 ──
document.getElementById('run-coaching').addEventListener('click', async () => {
  lockBtn('coaching'); setBadge('coaching','running');
  setTag('coaching','running','Running…'); resetSteps('coaching'); startOutput('coaching');
  await runCoachingAgent({ campaigns }, {
    onStep:  s => setStep('coaching', s),
    onToken: t => appendToken('coaching', t),
    onDone:  () => { setTag('coaching','done','Complete'); setBadge('coaching','done'); unlockBtn('coaching'); },
    onError: e => { setTag('coaching','error','Error'); appendToken('coaching',`\n\n> **Error:** ${e}`); unlockBtn('coaching'); },
  });
});
