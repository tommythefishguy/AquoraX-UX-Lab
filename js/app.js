const STORE_KEY = 'aquorax_ux_clean_home_v2';
const LEGACY_STORE_KEYS = ['aquorax_ux_clean_home_v1'];

const stages = [
  { title: 'Foundation', text: 'Begin logging tests and give the cycle time to establish.' },
  { title: 'Ammonia Watch', text: 'Ammonia activity suggests the cycle is beginning to move.' },
  { title: 'Nitrite Watch', text: 'Nitrite activity suggests the biological filter is developing.' },
  { title: 'Stability', text: 'Lower ammonia and nitrite with nitrate present suggests the reef is moving toward stability.' }
];

const $ = (id) => document.getElementById(id);
const defaultState = { tests: [], colonyAt: null, paradigmLogs: [] };
let state = load();

function load(){
  const tryKey = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  };
  const saved = tryKey(STORE_KEY) || LEGACY_STORE_KEYS.map(tryKey).find(Boolean) || {};
  return normalizeState({ ...defaultState, ...saved });
}

function normalizeState(input){
  return {
    tests: Array.isArray(input.tests) ? input.tests.map(normalizeTest).filter(Boolean) : [],
    colonyAt: input.colonyAt || null,
    paradigmLogs: Array.isArray(input.paradigmLogs) ? input.paradigmLogs : []
  };
}

function normalizeTest(t){
  if(!t || !t.at) return null;
  return {
    at: t.at,
    ammonia: toNumberOrNull(t.ammonia),
    nitrite: toNumberOrNull(t.nitrite),
    nitrate: toNumberOrNull(t.nitrate),
    ph: toNumberOrNull(t.ph)
  };
}

function save(showMessage = false){
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  render();
  if(showMessage) flashSave();
}

function flashSave(){
  const el = $('saveStatus');
  if(!el) return;
  el.textContent = 'Saved ✓';
  el.classList.add('visible');
  window.clearTimeout(flashSave.timer);
  flashSave.timer = window.setTimeout(()=> el.classList.remove('visible'), 1800);
}

function fmtDate(iso){
  return new Date(iso).toLocaleString([], { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

function toNumberOrNull(v){
  if(v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fieldValue(id){ return toNumberOrNull($(id).value); }
function val(test, key){ return test && test[key] !== null && test[key] !== undefined ? Number(test[key]) : null; }
function latest(){ return state.tests[0] || null; }
function isShowing(n, threshold = 0){ return n !== null && Number(n) > threshold; }
function isLow(n, threshold = 0.1){ return n !== null && Number(n) <= threshold; }

function getProgress(test){
  if(!test) return 0;
  const ammonia = val(test,'ammonia');
  const nitrite = val(test,'nitrite');
  const nitrate = val(test,'nitrate');

  if(isLow(ammonia) && isLow(nitrite) && isShowing(nitrate, 0)) return 100;
  if(isShowing(nitrite, 0.1)) return 66;
  if(isShowing(ammonia, 0.1)) return 35;
  if(ammonia !== null || nitrite !== null || nitrate !== null) return 15;
  return 0;
}

function getStage(test){
  const p = getProgress(test);
  if(p >= 100) return 3;
  if(p >= 66) return 2;
  if(p >= 35) return 1;
  return 0;
}

function displayReading(v, decimals = 2){
  if(v === null || v === undefined) return '—';
  const n = Number(v);
  if(!Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : String(n).replace(/0+$/,'').replace(/\.$/,'');
}

function renderStages(stageIndex){
  $('stageTrack').innerHTML = stages.map((s,i)=>`<div class="stage ${i===stageIndex?'active':''}"><strong>${i+1}. ${s.title}</strong><span>${s.text}</span></div>`).join('');
}

function renderGuidance(test){
  const title = $('guidanceTitle'), text = $('guidanceText'), list = $('guidanceList');
  if(!test){
    title.textContent = 'Ready for your first test';
    text.textContent = 'Add ammonia, nitrite, and nitrate readings to start the cycle journey.';
    list.innerHTML = ['Use the same test kit style where possible.','Log results regularly rather than chasing one number.','AquoraX will keep the wording calm and beginner-safe.'].map(x=>`<div class="guidance-item">${x}</div>`).join('');
    return;
  }

  const ammonia = val(test,'ammonia');
  const nitrite = val(test,'nitrite');
  const nitrate = val(test,'nitrate');
  const items=[];

  if(isShowing(ammonia, 0.1)) items.push('Ammonia is present. Keep watching the trend and avoid rushing sensitive livestock plans.');
  if(isShowing(nitrite, 0.1)) items.push('Nitrite is showing. This usually means the biological filter is developing, but stability is still building.');

  if(nitrate === 0) {
    items.push('Nitrate is not detected yet. That can be normal early in the cycle, especially while ammonia or nitrite are still changing.');
  } else if(isShowing(nitrate, 0)) {
    items.push('Nitrate is beginning to show. AquoraX will watch this alongside ammonia and nitrite before calling the cycle stable.');
  }

  if(isLow(ammonia) && isLow(nitrite) && isShowing(nitrate, 0)) {
    items.push('Ammonia and nitrite are low with nitrate present. This suggests the system is moving toward stability.');
  }

  if(isShowing(nitrate, 40)) items.push('Nitrate is elevated. Consider checking your trend and husbandry routine before making big changes.');
  if(!items.length) items.push('The reading is logged. Keep watching the trend over the next few tests.');

  title.textContent = stages[getStage(test)].title + ' guidance';
  text.textContent = 'AquoraX reviews your latest readings and translates them into calm cycle guidance.';
  list.innerHTML = items.map(x=>`<div class="guidance-item">${x}</div>`).join('');
}

function renderHistory(){
  const box = $('testHistory');
  if(!state.tests.length){
    box.className='history-list empty';
    box.textContent='No tests logged yet.';
    return;
  }
  box.className='history-list';
  box.innerHTML = state.tests.map(t=>`<div class="history-item"><div><strong>${fmtDate(t.at)}</strong><br><small>Cycle test saved</small></div><div class="readings"><span class="chip">NH₃ ${displayReading(t.ammonia)}</span><span class="chip">NO₂ ${displayReading(t.nitrite)}</span><span class="chip">NO₃ ${displayReading(t.nitrate)}</span>${t.ph!==null?`<span class="chip">pH ${displayReading(t.ph)}</span>`:''}</div></div>`).join('');
}

function renderLatestSummary(test){
  const el = $('latestSummary');
  if(!el) return;
  if(!test){
    el.innerHTML = '<span>No saved test yet.</span>';
    return;
  }
  el.innerHTML = `<span>Latest saved:</span><strong>NH₃ ${displayReading(test.ammonia)}</strong><strong>NO₂ ${displayReading(test.nitrite)}</strong><strong>NO₃ ${displayReading(test.nitrate)}</strong>${test.ph!==null?`<strong>pH ${displayReading(test.ph)}</strong>`:''}`;
}

function render(){
  const test = latest();
  const stageIndex = getStage(test), progress = getProgress(test);
  renderStages(stageIndex);
  $('currentStageTitle').textContent = stages[stageIndex].title;
  $('currentStageText').textContent = stages[stageIndex].text;
  $('confidenceValue').textContent = `${progress}%`;
  document.querySelector('.confidence-ring').style.setProperty('--progress', `${progress}%`);
  $('colonyStatus').textContent = state.colonyAt ? fmtDate(state.colonyAt) : 'Not logged';
  $('paradigmStatus').textContent = state.paradigmLogs.length ? `${state.paradigmLogs.length} dose${state.paradigmLogs.length===1?'':'s'} logged` : 'Not logged';
  renderGuidance(test);
  renderHistory();
  renderLatestSummary(test);
}

$('testForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const test = {
    at:new Date().toISOString(),
    ammonia: fieldValue('ammonia'),
    nitrite: fieldValue('nitrite'),
    nitrate: fieldValue('nitrate'),
    ph: fieldValue('ph')
  };

  if(test.ammonia === null && test.nitrite === null && test.nitrate === null && test.ph === null){
    alert('Add at least one reading before saving.');
    return;
  }

  state.tests.unshift(test);
  state.tests = state.tests.slice(0,30);
  e.target.reset();
  save(true);
});

$('logColonyBtn').addEventListener('click', ()=>{ state.colonyAt = new Date().toISOString(); save(true); });
$('logParadigmBtn').addEventListener('click', ()=>{ state.paradigmLogs.unshift(new Date().toISOString()); save(true); });
$('clearTestsBtn').addEventListener('click', ()=>{ if(confirm('Clear all water test history in UX Lab?')){ state.tests=[]; save(true); }});
$('resetJourneyBtn').addEventListener('click', ()=>{ if(confirm('Reset cycle journey logs in UX Lab?')){ state={...defaultState}; save(true); }});
document.querySelectorAll('[data-scroll]').forEach(btn=>btn.addEventListener('click',()=>$(btn.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'})));

render();
