const STORE_KEY = 'aquorax_ux_clean_home_v1';
const stages = [
  { title: 'Foundation', text: 'Begin logging tests and give the cycle time to establish.' },
  { title: 'Ammonia Watch', text: 'Ammonia activity suggests the cycle is beginning to move.' },
  { title: 'Nitrite Watch', text: 'Nitrite activity suggests the biological filter is developing.' },
  { title: 'Stability', text: 'Lower ammonia and nitrite with nitrate present suggests the reef is moving toward stability.' }
];
const $ = (id) => document.getElementById(id);
const defaultState = { tests: [], colonyAt: null, paradigmLogs: [] };
let state = load();
function load(){ try { return { ...defaultState, ...(JSON.parse(localStorage.getItem(STORE_KEY)) || {}) }; } catch { return {...defaultState}; } }
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); render(); }
function fmtDate(iso){ return new Date(iso).toLocaleString([], { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
function num(v){ const n = parseFloat(v); return Number.isFinite(n) ? n : null; }
function latest(){ return state.tests[0] || null; }
function getProgress(test){
  if(!test) return 0;
  const ammonia = test.ammonia ?? 0, nitrite = test.nitrite ?? 0, nitrate = test.nitrate ?? 0;
  if(ammonia <= 0.1 && nitrite <= 0.1 && nitrate > 0) return 100;
  if(nitrite > 0.1) return 66;
  if(ammonia > 0.1) return 35;
  return 15;
}
function getStage(test){
  if(!test) return 0;
  const p = getProgress(test);
  if(p >= 100) return 3;
  if(p >= 66) return 2;
  if(p >= 35) return 1;
  return 0;
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
  const a=test.ammonia??0,n=test.nitrite??0,no3=test.nitrate??0;
  let items=[];
  if(a>0.1) items.push('Ammonia is present. Review livestock plans and keep watching the cycle trend.');
  if(n>0.1) items.push('Nitrite is showing. This usually means the cycle is progressing, but stability is still developing.');
  if(a<=0.1 && n<=0.1 && no3>0) items.push('Ammonia and nitrite are low with nitrate present. This suggests the system is moving toward stability.');
  if(no3>40) items.push('Nitrate is elevated. Consider checking your trend and husbandry routine before making big changes.');
  if(!items.length) items.push('The reading is logged. Keep watching the trend over the next tests.');
  title.textContent = stages[getStage(test)].title + ' guidance';
  text.textContent = 'AquoraX reviews your latest readings and translates them into calm cycle guidance.';
  list.innerHTML = items.map(x=>`<div class="guidance-item">${x}</div>`).join('');
}
function renderHistory(){
  const box = $('testHistory');
  if(!state.tests.length){ box.className='history-list empty'; box.textContent='No tests logged yet.'; return; }
  box.className='history-list';
  box.innerHTML = state.tests.map(t=>`<div class="history-item"><div><strong>${fmtDate(t.at)}</strong><br><small>Cycle test logged</small></div><div class="readings"><span class="chip">NH₃ ${t.ammonia ?? '—'}</span><span class="chip">NO₂ ${t.nitrite ?? '—'}</span><span class="chip">NO₃ ${t.nitrate ?? '—'}</span>${t.ph!==null?`<span class="chip">pH ${t.ph}</span>`:''}</div></div>`).join('');
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
  renderGuidance(test); renderHistory();
}
$('testForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const test = { at:new Date().toISOString(), ammonia:num($('ammonia').value), nitrite:num($('nitrite').value), nitrate:num($('nitrate').value), ph:num($('ph').value) };
  state.tests.unshift(test); state.tests = state.tests.slice(0,30); e.target.reset(); save();
});
$('logColonyBtn').addEventListener('click', ()=>{ state.colonyAt = new Date().toISOString(); save(); });
$('logParadigmBtn').addEventListener('click', ()=>{ state.paradigmLogs.unshift(new Date().toISOString()); save(); });
$('clearTestsBtn').addEventListener('click', ()=>{ if(confirm('Clear all water test history in UX Lab?')){ state.tests=[]; save(); }});
$('resetJourneyBtn').addEventListener('click', ()=>{ if(confirm('Reset cycle journey logs in UX Lab?')){ state={...defaultState}; save(); }});
document.querySelectorAll('[data-scroll]').forEach(btn=>btn.addEventListener('click',()=>$(btn.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'})));
render();
