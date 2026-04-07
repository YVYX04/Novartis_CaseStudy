const navItems = document.querySelectorAll('.nav-item');
const views = {
  dashboard: document.getElementById('dashboardView'),
  campaign: document.getElementById('campaignView'),
  coaching: document.getElementById('coachingView'),
  field: document.getElementById('fieldView'),
  insights: document.getElementById('insightsView')
};
const pageTitle = document.getElementById('pageTitle');

function switchView(viewName) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  navItems.forEach(item => item.classList.remove('active'));
  views[viewName].classList.add('active');
  document.querySelector(`.nav-item[data-view="${viewName}"]`).classList.add('active');
  pageTitle.textContent = {
    dashboard: 'Overview',
    campaign: 'Campaign Copilot',
    coaching: 'Manager Coaching',
    field: 'Field Activation',
    insights: 'Adoption Insights'
  }[viewName];
}

navItems.forEach(item => item.addEventListener('click', () => switchView(item.dataset.view)));
document.querySelectorAll('[data-jump]').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.jump)));

function fakeLoad(loader, callback) {
  loader.classList.remove('hidden');
  setTimeout(() => {
    loader.classList.add('hidden');
    callback();
  }, 1400);
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  el.classList.remove('muted');
  el.innerHTML = html;
}

function campaignHTML() {
  const product = document.getElementById('campaignProduct').value;
  const country = document.getElementById('campaignCountry').value;
  const audience = document.getElementById('campaignAudience').value;
  const objective = document.getElementById('campaignObjective').value;
  const budget = document.getElementById('campaignBudget').value;
  const channels = document.getElementById('campaignChannels').value;

  return `
    <div class="section">
      <h4>Recommended omnichannel plan</h4>
      <p><strong>Context analyzed:</strong> ${product} · ${country} · ${audience} · Objective: ${objective} · Budget: ${budget}</p>
    </div>

    <div class="section mini-grid">
      <div class="mini-card">
        <strong>Suggested sequence</strong>
        <ul>
          <li>Week 1: personalized email with approved value message</li>
          <li>Week 2: expert webinar invitation for engaged HCPs</li>
          <li>Week 3: field-rep follow-up on high-interest accounts</li>
          <li>Week 4: reminder touchpoint with tailored asset</li>
        </ul>
      </div>
      <div class="mini-card">
        <strong>Recommended channels</strong>
        <p>${channels}</p>
        <p><strong>Rationale:</strong> balances reach, message recall, and constrained budget while supporting omnichannel orchestration.</p>
      </div>
    </div>

    <div class="section">
      <strong>AI recommendation</strong>
      <p>Prioritize a 4-week journey centered on one core approved message and adapt it by channel rather than building separate campaign assets from scratch. In ${country}, use a low-complexity sequence to improve speed of execution and manager visibility.</p>
    </div>

    <div class="section mini-grid">
      <div class="mini-card">
        <strong>Draft KPIs</strong>
        <ul>
          <li>Email open rate target: 32%</li>
          <li>Webinar registration target: 12%</li>
          <li>Rep follow-up completion: 85%</li>
          <li>Message recall lift: +10 pts</li>
        </ul>
      </div>
      <div class="mini-card">
        <strong>Manager note</strong>
        <p>Use this plan as a coaching example for junior marketeers to demonstrate how one message can be translated across multiple touchpoints without agency dependence.</p>
      </div>
    </div>

    <div class="callout">
      Compliance check: external-facing copy requires local review. Only approved claims and source content should be used before deployment.
    </div>
  `;
}

function coachingHTML() {
  const maturity = document.getElementById('coachMaturity').value;
  const barrier = document.getElementById('coachBarrier').value;
  const country = document.getElementById('coachCountry').value;
  const horizon = document.getElementById('coachHorizon').value;

  return `
    <div class="section">
      <h4>Manager coaching toolkit</h4>
      <p><strong>Context analyzed:</strong> ${maturity} · Main barrier: ${barrier} · Scope: ${country} · Horizon: ${horizon}</p>
    </div>

    <div class="section mini-grid">
      <div class="mini-card">
        <strong>Talking points for team meeting</strong>
        <ul>
          <li>AI is a support layer, not a replacement for judgment.</li>
          <li>Start with one recurring task that wastes team capacity.</li>
          <li>Use approved prompts and shared templates to reduce anxiety.</li>
          <li>Managers will review outputs and model the new behavior.</li>
        </ul>
      </div>
      <div class="mini-card">
        <strong>30-day adoption path</strong>
        <ul>
          <li>Week 1: live walkthrough by manager</li>
          <li>Week 2: role-based practice session</li>
          <li>Week 3: peer showcase of one success story</li>
          <li>Week 4: KPI review and reinforcement</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <strong>Targeted intervention</strong>
      <p>Because the dominant barrier is <strong>${barrier.toLowerCase()}</strong>, the manager should anchor adoption on immediate practical value rather than abstract AI education. This reduces perceived risk and makes the change visible in daily workflow.</p>
    </div>

    <div class="section mini-grid">
      <div class="mini-card">
        <strong>Suggested manager KPIs</strong>
        <ul>
          <li>Training completion: 80%+</li>
          <li>Weekly active usage: 65%+</li>
          <li>Self-reported confidence uplift: +15 pts</li>
          <li>Reuse of approved templates: 70%+</li>
        </ul>
      </div>
      <div class="mini-card">
        <strong>Escalation trigger</strong>
        <p>If adoption stays below 50% after two reinforcement cycles, launch a country-level champion model and add manager office hours for practical support.</p>
      </div>
    </div>

    <div class="callout">
      Human leadership remains essential. The companion provides coaching structure, but accountability for team adoption stays with the manager.
    </div>
  `;
}

function fieldHTML() {
  const message = document.getElementById('fieldMessage').value;
  const objective = document.getElementById('fieldObjective').value;
  const segment = document.getElementById('fieldSegment').value;
  const country = document.getElementById('fieldCountry').value;

  return `
    <div class="section">
      <h4>Rep activation kit</h4>
      <p><strong>Context analyzed:</strong> ${country} · ${segment} · Objective: ${objective}</p>
    </div>

    <div class="section mini-grid">
      <div class="mini-card">
        <strong>Rep briefing</strong>
        <p><strong>Core message:</strong> ${message}</p>
        <ul>
          <li>Use after recent digital engagement, not as first touchpoint.</li>
          <li>Focus on one relevant proof point and one action request.</li>
          <li>Document response quality in CRM for next-best-action refinement.</li>
        </ul>
      </div>
      <div class="mini-card">
        <strong>Suggested next actions</strong>
        <ul>
          <li>Prioritize HCPs with high content interaction in last 14 days</li>
          <li>Use 2-minute follow-up script in rep call</li>
          <li>Trigger webinar reminder for non-converted accounts</li>
          <li>Escalate scientific questions to medical channels</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <strong>Execution recommendation</strong>
      <p>For <strong>${segment.toLowerCase()}</strong> in <strong>${country}</strong>, the field team should use a short, high-clarity follow-up sequence that converts prior digital attention into a concrete action. The purpose is not more touchpoints, but better coordinated ones.</p>
    </div>

    <div class="section mini-grid">
      <div class="mini-card">
        <strong>Field KPIs</strong>
        <ul>
          <li>Follow-up completion within 5 days: 90%</li>
          <li>Meeting conversion: +8%</li>
          <li>Approved content utilization: 75%</li>
        </ul>
      </div>
      <div class="mini-card">
        <strong>Manager coaching cue</strong>
        <p>Review one recorded example in weekly sales huddle to reinforce how digital and rep-led channels should work as one coordinated journey.</p>
      </div>
    </div>

    <div class="callout">
      This output is an execution support draft. Local market rules and final content approval still apply before external use.
    </div>
  `;
}

document.getElementById('generateCampaignBtn').addEventListener('click', () => {
  fakeLoad(document.getElementById('campaignLoader'), () => setHTML('campaignOutput', campaignHTML()));
});

document.getElementById('generateCoachingBtn').addEventListener('click', () => {
  fakeLoad(document.getElementById('coachingLoader'), () => setHTML('coachingOutput', coachingHTML()));
});

document.getElementById('generateFieldBtn').addEventListener('click', () => {
  fakeLoad(document.getElementById('fieldLoader'), () => setHTML('fieldOutput', fieldHTML()));
});