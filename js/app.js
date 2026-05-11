const STORE_KEY = 'aquoraxHomeOnlyV2Dose';
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
    return saved && typeof saved === 'object' ? { tests: [], colony: null, paradigm: null, tankVolume: '', tankUnit: 'litres', ...saved } : defaultState();
  } catch { return defaultState(); }
}
function defaultState(){ return { tests: [], colony: null, paradigm: null, tankVolume: '', tankUnit: 'litres' }; }
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
  if(!test) return ['Start with a water test. AquoraX will then translate the readings into calm cycle guidance.', 'Use Rapid Cycle and Paradigm logs to keep the journey clear without overcomplicating the process.'];
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
function formatDate(iso){
  if(!iso) return '';
  return new Date(iso).toLocaleString([], { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
}
function calculateDoses(){
  const raw = num($('tankVolume').value);
  const unit = $('tankUnit').value;
  state.tankVolume = $('tankVolume').value;
  state.tankUnit = unit;
  saveState();

  if(!raw || raw <= 0){
    $('colonyDose').textContent = 'Add tank size';
    $('paradigmDose').textContent = 'Add tank size';
    return;
  }

  const litres = unit === 'gallons' ? raw * 3.78541 : raw;
  const gallons = litres / 3.78541;

  // Blue Shark/ATM label-style calculations used for the UX Lab calculator:
  // Rapid Cycle / Colony: 118 ml per 45 L / 12 US gal.
  // Paradigm: 5 ml per 37.85 L / 10 US gal.
  const colonyMl = (litres / 45) * 118;
  const paradigmMl = (gallons / 10) * 5;

  $('colonyDose').textContent = `${roundDose(colonyMl)} ml`;
  $('paradigmDose').textContent = `${roundDose(paradigmMl)} ml`;
}
function roundDose(value){
  if(value < 10) return Math.round(value * 10) / 10;
  return Math.round(value);
}
function nextParadigmDate(){
  if(!state.paradigm) return '';
  const d = new Date(state.paradigm);
  d.setDate(d.getDate() + 14);
  return d.toLocaleDateString([], { day:'numeric', month:'short', year:'numeric' });
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

  const colonyLogged = Boolean(state.colony);
  $('colonyStatus').textContent = colonyLogged ? `Rapid Cycle added ${formatDate(state.colony)}` : 'Not logged';
  $('colonyBtn').textContent = colonyLogged ? 'Rapid Cycle confirmed ✓' : 'Confirm Rapid Cycle added';
  $('colonyBtn').disabled = colonyLogged;
  $('colonyCard').classList.toggle('complete', colonyLogged);

  $('paradigmStatus').textContent = state.paradigm ? `Logged ${formatDate(state.paradigm)}` : 'Not logged';
  $('paradigmNext').textContent = state.paradigm ? `Next suggested reminder: ${nextParadigmDate()} · 2 week dose` : 'Runs on a 2 week dose rhythm.';
  $('tankVolume').value = state.tankVolume || '';
  $('tankUnit').value = state.tankUnit || 'litres';
  calculateDoses();
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
function openModal(title, text){
  $('modalTitle').textContent = title;
  $('modalText').textContent = text;
  $('modalBackdrop').hidden = false;
  document.body.classList.add('modal-open');
}
function closeModal(){
  $('modalBackdrop').hidden = true;
  document.body.classList.remove('modal-open');
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
$('colonyBtn').addEventListener('click', () => {
  if(state.colony) return;
  const ok = confirm('Confirm Rapid Cycle / Colony has been added to this reef? This will lock the button so it cannot be logged twice.');
  if(!ok) return;
  state.colony = new Date().toISOString();
  saveState();
  render();
  openModal('Congratulations.', 'This is your first step into your reefing journey. AquoraX will now follow your cycle through each water test you save.');
});
$('paradigmBtn').addEventListener('click', () => {
  state.paradigm = new Date().toISOString();
  saveState();
  render();
  openModal('Paradigm logged.', 'AquoraX has saved this Paradigm dose and set the rhythm to 2 weeks.');
});
$('tankVolume').addEventListener('input', calculateDoses);
$('tankUnit').addEventListener('change', calculateDoses);
$('resetBtn').addEventListener('click', () => { if(confirm('Reset this UX Lab home data?')){ state = defaultState(); saveState(); render(); } });
$('clearHistory').addEventListener('click', () => { if(confirm('Clear water test history?')){ state.tests = []; saveState(); render(); } });
$('scrollToLog').addEventListener('click', () => $('testForm').scrollIntoView({ behavior:'smooth', block:'center' }));
$('modalClose').addEventListener('click', closeModal);
$('modalOk').addEventListener('click', closeModal);
$('modalBackdrop').addEventListener('click', (e) => { if(e.target === $('modalBackdrop')) closeModal(); });
document.querySelectorAll('.stage-card').forEach(card => card.addEventListener('click', () => card.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' })));
render();
