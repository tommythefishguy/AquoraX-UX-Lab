const STORE_KEY = 'aquoraxHomeOnlyV1';
const $ = (id) => document.getElementById(id);

const stages = {
  1: { name: 'Foundation', progress: 25, desc: 'Begin logging tests so AquoraX can follow the cycle trend.' },
  2: { name: 'Ammonia Watch', progress: 50, desc: 'Ammonia activity suggests the cycle is beginning to move.' },
  3: { name: 'Nitrite Watch', progress: 75, desc: 'Nitrite activity suggests the biological filter is developing.' },
  4: { name: 'Stability', progress: 100, desc: 'Lower ammonia and nitrite with nitrate present suggests the reef is moving toward stability.' }
};

let state = loadState();

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved && typeof saved === 'object' ? { tests: [], colony: null, paradigm: null, ...saved } : defaultState();
  } catch { return defaultState(); }
}
function defaultState(){ return { tests: [], colony: null, paradigm: null }; }
function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function num(v){
  if(v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function fmt(n, dp=2){ return n === null || n === undefined ? '—' : Number(n).toFixed(dp).replace(/\.00$/, ''); }
function latest(){ return state.tests[0] || null; }
function detectStage(test){
  if(!test) return 1;
  const a = test.ammonia ?? 0, ni = test.nitrite ?? 0, na = test.nitrate ?? 0;
  if(a <= 0.05 && ni <= 0.05 && na > 0) return 4;
  if(ni > 0.05) return 3;
  if(a > 0.05) return 2;
  return 1;
}
function guidance(stage, test){
  if(!test) return ['Start with a water test. AquoraX will then translate the readings into calm cycle guidance.', 'Use Colony and Paradigm logs to keep the journey clear without overcomplicating the process.'];
  const items = [];
  const a = test.ammonia ?? 0, ni = test.nitrite ?? 0, na = test.nitrate ?? 0;
  if(a > 0.05) items.push('Ammonia is present. Review livestock plans and keep watching the cycle trend.');
  else items.push('Ammonia is low. Keep watching the pattern across the next tests.');
  if(ni > 0.05) items.push('Nitrite is showing. This usually means the biological filter is developing, but stability is still building.');
  else items.push('Nitrite is low. AquoraX will keep checking this alongside ammonia and nitrate.');
  if(na > 0) items.push('Nitrate is beginning to show. This can be a sign the cycle is moving forward.');
  else items.push('Nitrate has not been detected yet. Keep logging tests so the trend becomes clearer.');
  if(stage === 4) items.push('Ammonia and nitrite are low with nitrate present. This suggests the system is moving toward stability.');
  return items;
}
function render(){
  const test = latest();
  const stage = detectStage(test);
  const info = stages[stage];
  document.querySelectorAll('.stage-card').forEach(card => card.classList.toggle('active', Number(card.dataset.stage) === stage));
  $('stageName').textContent = info.name;
  $('stageDesc').textContent = info.desc;
  $('progressText').textContent = info.progress + '%';
  document.querySelector('.progress-ring').style.setProperty('--angle', info.progress + '%');
  $('guidanceTitle').textContent = info.name + ' guidance';
  $('guidanceList').innerHTML = guidance(stage, test).map(t => `<div class="guidance-item">${t}</div>`).join('');
  $('colonyStatus').textContent = state.colony ? `Logged ${new Date(state.colony).toLocaleString([], { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}` : 'Not logged';
  $('paradigmStatus').textContent = state.paradigm ? `Logged ${new Date(state.paradigm).toLocaleString([], { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}` : 'Not logged';
  renderHistory();
}
function renderHistory(){
  const list = $('historyList');
  if(!state.tests.length){ list.innerHTML = '<div class="history-empty">No water tests saved yet.</div>'; return; }
  list.innerHTML = state.tests.map(t => {
    const d = new Date(t.date);
    return `<article class="history-item"><div class="history-date">${d.toLocaleString([], { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div><div class="chips"><span class="chip">NH₃ ${fmt(t.ammonia)}</span><span class="chip">NO₂ ${fmt(t.nitrite)}</span><span class="chip">NO₃ ${fmt(t.nitrate,1)}</span><span class="chip">pH ${fmt(t.ph,2)}</span></div></article>`;
  }).join('');
}

$('testForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const test = { date: new Date().toISOString(), ammonia: num($('ammonia').value), nitrite: num($('nitrite').value), nitrate: num($('nitrate').value), ph: num($('ph').value) };
  if(test.ammonia === null && test.nitrite === null && test.nitrate === null && test.ph === null){ $('saveMsg').textContent = 'Add at least one reading first.'; return; }
  state.tests.unshift(test);
  state.tests = state.tests.slice(0, 30);
  saveState();
  $('saveMsg').textContent = 'Saved ✓';
  e.target.reset();
  render();
  setTimeout(() => $('saveMsg').textContent = '', 2200);
});
$('colonyBtn').addEventListener('click', () => { state.colony = new Date().toISOString(); saveState(); render(); });
$('paradigmBtn').addEventListener('click', () => { state.paradigm = new Date().toISOString(); saveState(); render(); });
$('resetBtn').addEventListener('click', () => { if(confirm('Reset this UX Lab home data?')){ state = defaultState(); saveState(); render(); } });
$('clearHistory').addEventListener('click', () => { if(confirm('Clear water test history?')){ state.tests = []; saveState(); render(); } });
$('scrollToLog').addEventListener('click', () => $('testForm').scrollIntoView({ behavior:'smooth', block:'center' }));
document.querySelectorAll('.stage-card').forEach(card => card.addEventListener('click', () => card.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' })));
render();
