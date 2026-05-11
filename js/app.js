const STORE_KEY = 'aquoraxHomeOnlyV3CycleComplete';
const $ = (id) => document.getElementById(id);

const stages = {
  1: { name: 'Foundation', progress: 25, desc: 'Begin logging tests so AquoraX can follow the cycle trend.' },
  2: { name: 'Ammonia Watch', progress: 50, desc: 'Ammonia activity suggests the cycle is beginning to move.' },
  3: { name: 'Nitrite Watch', progress: 75, desc: 'Nitrite activity suggests the biological filter is developing.' },
  4: { name: 'Stability Watch', progress: 80, desc: 'Ammonia and nitrite are calming down while AquoraX watches for nitrate.' },
  5: { name: 'Cycle Complete', progress: 100, desc: 'Nitrate is present. Your foundation cycle is complete and the next reefing journey has begun.' }
};

let state = loadState();

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved && typeof saved === 'object' ? { tests: [], colony: null, paradigm: null, tankVolume: '', tankUnit: 'litres', cycleCompletePopupSeen: false, ...saved } : defaultState();
  } catch { return defaultState(); }
}
function defaultState(){ return { tests: [], colony: null, paradigm: null, tankVolume: '', tankUnit: 'litres', cycleCompletePopupSeen: false }; }
function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function num(v){
  if(v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function fmt(n, dp=2){ return n === null || n === undefined ? '—' : Number(n).toFixed(dp).replace(/\.00$/, ''); }
function latest(){ return state.tests[0] || null; }
function nitratePresent(test){
  return test && typeof test.nitrate === 'number' && test.nitrate > 0;
}
function shouldCelebrateCycleComplete(previousLatest, newTest){
  // Show the celebration when a saved test proves nitrate is present for the first time.
  // This also protects against older builds where Stage 5 may have appeared without the modal.
  return nitratePresent(newTest) && !state.cycleCompletePopupSeen;
}
function detectStage(test){
  if(!test) return 1;
  const a = test.ammonia ?? 0, ni = test.nitrite ?? 0, na = test.nitrate ?? 0;
  if(nitratePresent(test)) return 5;
  if(a <= 0.05 && ni <= 0.05) return 4;
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
  if(na > 0) items.push('Nitrate is present. AquoraX marks the foundation cycle as complete and moves the reef into the next journey stage.');
  else items.push('Nitrate has not been detected yet. Keep logging tests so the trend becomes clearer.');
  if(stage === 5) items.push('Congratulations — your cycle is complete. Keep moving slowly, keep testing, and let the reef mature with patience.');
  if(stage === 4) items.push('Ammonia and nitrite are calm. AquoraX is watching for nitrate before calling the cycle complete.');
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
  const previousLatest = latest();
  const test = { date: new Date().toISOString(), ammonia: num($('ammonia').value), nitrite: num($('nitrite').value), nitrate: num($('nitrate').value), ph: num($('ph').value) };
  if(test.ammonia === null && test.nitrite === null && test.nitrate === null && test.ph === null){ $('saveMsg').textContent = 'Add at least one reading first.'; return; }

  const completedNow = shouldCelebrateCycleComplete(previousLatest, test);
  state.tests.unshift(test);
  state.tests = state.tests.slice(0, 30);
  if(completedNow) state.cycleCompletePopupSeen = true;

  saveState();
  $('saveMsg').textContent = nitratePresent(test) ? 'Saved ✓ Cycle complete' : 'Saved ✓';
  e.target.reset();
  render();

  if(completedNow){
    window.setTimeout(() => {
      openModal('Congratulations — your cycle is complete.', 'Your reef foundation is complete. Your journey has officially begun. Move slowly, keep testing, and let AquoraX help you build a stable reef with confidence.');
    }, 120);
  }
  setTimeout(() => $('saveMsg').textContent = '', 2600);
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

// Beginner Mode Cycle / Tests navigation + reef testing module
const REEF_STORE_KEY = 'aquoraxBeginnerReefTestsV1';
let reefState = loadReefState();

function loadReefState(){
  try{
    const saved = JSON.parse(localStorage.getItem(REEF_STORE_KEY));
    return saved && typeof saved === 'object' ? { reefTests: [], tempUnit:'c', salinityUnit:'ppt', ...saved } : { reefTests: [], tempUnit:'c', salinityUnit:'ppt' };
  } catch { return { reefTests: [], tempUnit:'c', salinityUnit:'ppt' }; }
}
function saveReefState(){ localStorage.setItem(REEF_STORE_KEY, JSON.stringify(reefState)); }
function latestReef(){ return reefState.reefTests[0] || null; }
function setView(view){
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('view-active', v.dataset.view === view));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.target === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const paramDefs = [
  { key:'temp', label:'Temperature', unit:'°C', meaning:'Thermal stability', ideal:[24,26], watch:[23,27], dp:1 },
  { key:'salinity', label:'Salinity', unit:'ppt', meaning:'Salt balance', ideal:[34,36], watch:[33,37], dp:1, sgIdeal:[1.024,1.026], sgWatch:[1.023,1.027] },
  { key:'ph', label:'pH', unit:'', meaning:'Daily rhythm', ideal:[8.0,8.4], watch:[7.8,8.5], dp:2 },
  { key:'alk', label:'Alkalinity', unit:'dKH', meaning:'Reef stability', ideal:[7.5,9.5], watch:[7,11], dp:1 },
  { key:'nitrate', label:'Nitrate', unit:'ppm', meaning:'Nutrient level', ideal:[2,15], watch:[0,30], dp:1 },
  { key:'phosphate', label:'Phosphate', unit:'ppm', meaning:'Nutrient balance', ideal:[0.02,0.08], watch:[0.01,0.15], dp:2 },
  { key:'calcium', label:'Calcium', unit:'ppm', meaning:'Coral building', ideal:[400,450], watch:[380,480], dp:0 },
  { key:'magnesium', label:'Magnesium', unit:'ppm', meaning:'Buffer support', ideal:[1250,1400], watch:[1200,1500], dp:0 }
];
function statusFor(value, def){
  if(value === null || value === undefined) return { label:'Not logged', tone:'empty', note:'Add a reading to start tracking.' };

  let checkValue = value;
  let ideal = def.ideal;
  let watch = def.watch;

  // Salinity is stored internally as ppt, but when the user chooses SG the
  // status should be judged against SG reef targets. This keeps 1.025 SG
  // correctly marked as Stable instead of Watch.
  if(def.key === 'salinity' && reefState.salinityUnit === 'sg'){
    checkValue = pptToSg(value);
    ideal = def.sgIdeal || [1.024, 1.026];
    watch = def.sgWatch || [1.023, 1.027];
  }

  if(checkValue >= ideal[0] && checkValue <= ideal[1]) return { label:'Stable', tone:'good', note:'Inside beginner-safe target range.' };
  if(checkValue >= watch[0] && checkValue <= watch[1]) return { label:'Watch', tone:'watch', note:'Near range. Review trend before changing anything.' };
  return { label:'Review', tone:'review', note:'Outside comfort range. Re-test and review stability.' };
}
function cToF(c){ return (Number(c) * 9 / 5) + 32; }
function fToC(f){ return (Number(f) - 32) * 5 / 9; }
function pptToSg(ppt){ return 1 + (Number(ppt) * 0.000756); }
function sgToPpt(sg){ return (Number(sg) - 1) / 0.000756; }
function cleanNumber(value, dp){
  const fixed = Number(value).toFixed(dp);
  return fixed.replace(/\.0$|\.00$/, '');
}
function displayValue(value, def){
  if(value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  if(def.key === 'temp' && reefState.tempUnit === 'f') return `${cleanNumber(cToF(value), 1)} °F`;
  if(def.key === 'salinity' && reefState.salinityUnit === 'sg') return `${Number(pptToSg(value)).toFixed(3)} SG`;
  return `${cleanNumber(value, def.dp)}${def.unit ? ' ' + def.unit : ''}`;
}
function updateUnitUI(){
  const tempUnit = $('tempUnit');
  const salinityUnit = $('salinityUnit');
  if(tempUnit) tempUnit.value = reefState.tempUnit || 'c';
  if(salinityUnit) salinityUnit.value = reefState.salinityUnit || 'ppt';
  const tempLabel = $('tempUnitLabel');
  const salinityLabel = $('salinityUnitLabel');
  if(tempLabel) tempLabel.textContent = reefState.tempUnit === 'f' ? '°F' : '°C';
  if(salinityLabel) salinityLabel.textContent = reefState.salinityUnit === 'sg' ? 'SG' : 'ppt';
  const tempInput = $('temp');
  const salinityInput = $('salinity');
  if(tempInput) tempInput.placeholder = reefState.tempUnit === 'f' ? '77.0' : '25.0';
  if(salinityInput){
    salinityInput.placeholder = reefState.salinityUnit === 'sg' ? '1.026' : '35.0';
    salinityInput.step = reefState.salinityUnit === 'sg' ? '0.001' : '0.1';
  }
}
function renderReefTests(){
  updateUnitUI();
  const test = latestReef();
  const grid = $('paramGrid');
  if(grid){
    grid.innerHTML = paramDefs.map(def => {
      const value = test ? test[def.key] : null;
      const status = statusFor(value, def);
      return `<article class="param-card ${status.tone}"><div><p class="label">${def.meaning}</p><h3>${def.label}</h3></div><strong>${displayValue(value, def)}</strong><span>${status.label}</span><small>${status.note}</small></article>`;
    }).join('');
  }
  const guidance = $('reefGuidanceList');
  if(guidance){
    if(!test){
      guidance.innerHTML = '<div class="guidance-item">Log your first reef test to unlock a calm snapshot of temperature, salinity, pH, alkalinity, nitrate and phosphate.</div><div class="guidance-item">Beginner Mode focuses on trends and stability before suggesting any action.</div>';
    } else {
      const review = paramDefs.map(def => ({ def, value:test[def.key], status: statusFor(test[def.key], def) }));
      const watch = review.filter(x => x.status.tone === 'watch').map(x => x.def.label);
      const reviewItems = review.filter(x => x.status.tone === 'review').map(x => x.def.label);
      const items = [];
      if(!watch.length && !reviewItems.length) items.push('Your logged reef signals look stable. Keep watching the trend rather than chasing small daily movement.');
      if(watch.length) items.push(`Watch ${watch.join(', ')} over the next readings. AquoraX is looking for pattern, not panic.`);
      if(reviewItems.length) items.push(`Review ${reviewItems.join(', ')}. Re-test calmly and compare against recent readings before making changes.`);
      items.push('Keep the reef steady: small changes, consistent testing, and patient observation.');
      guidance.innerHTML = items.map(t => `<div class="guidance-item">${t}</div>`).join('');
    }
  }
  const history = $('reefHistoryList');
  if(history){
    if(!reefState.reefTests.length){ history.innerHTML = '<div class="history-empty">No reef tests saved yet.</div>'; return; }
    history.innerHTML = reefState.reefTests.map(t => `<article class="history-item"><div class="history-date">${formatDate(t.date)}</div><div class="chips"><span class="chip">Temp ${displayValue(t.temp,paramDefs[0])}</span><span class="chip">Sal ${displayValue(t.salinity,paramDefs[1])}</span><span class="chip">KH ${displayValue(t.alk,paramDefs[3])}</span><span class="chip">NO₃ ${displayValue(t.nitrate,paramDefs[4])}</span><span class="chip">PO₄ ${displayValue(t.phosphate,paramDefs[5])}</span></div></article>`).join('');
  }
}

function bindBeginnerNav(){
  document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.target)));
  const testsFocus = $('testsFocusBtn');
  if(testsFocus) testsFocus.addEventListener('click', () => $('reefTestForm').scrollIntoView({ behavior:'smooth', block:'center' }));
  const tempUnit = $('tempUnit');
  if(tempUnit) tempUnit.addEventListener('change', () => { reefState.tempUnit = tempUnit.value; saveReefState(); updateUnitUI(); renderReefTests(); });
  const salinityUnit = $('salinityUnit');
  if(salinityUnit) salinityUnit.addEventListener('change', () => { reefState.salinityUnit = salinityUnit.value; saveReefState(); updateUnitUI(); renderReefTests(); });
  const reefForm = $('reefTestForm');
  if(reefForm){
    reefForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const test = {
        date: new Date().toISOString(),
        temp: $('temp').value === '' ? null : (reefState.tempUnit === 'f' ? fToC(num($('temp').value)) : num($('temp').value)),
        salinity: $('salinity').value === '' ? null : (reefState.salinityUnit === 'sg' ? sgToPpt(num($('salinity').value)) : num($('salinity').value)),
        ph: num($('testPh').value),
        alk: num($('alk').value),
        nitrate: num($('testNitrate').value),
        phosphate: num($('phosphate').value),
        calcium: num($('calcium').value),
        magnesium: num($('magnesium').value)
      };
      const hasAny = Object.keys(test).some(k => k !== 'date' && test[k] !== null);
      if(!hasAny){ $('reefSaveMsg').textContent = 'Add at least one reef reading first.'; return; }
      reefState.reefTests.unshift(test);
      reefState.reefTests = reefState.reefTests.slice(0, 40);
      saveReefState();
      reefForm.reset();
      $('reefSaveMsg').textContent = 'Reef test saved ✓';
      renderReefTests();
      setTimeout(() => $('reefSaveMsg').textContent = '', 2400);
    });
  }
  const clearReef = $('clearReefHistory');
  if(clearReef) clearReef.addEventListener('click', () => { if(confirm('Clear reef test history?')){ reefState.reefTests = []; saveReefState(); renderReefTests(); } });
}

bindBeginnerNav();
renderReefTests();

// AquoraX Beginner Livestock tracker
const LIVESTOCK_STORE_KEY = 'aquoraxBeginnerLivestockV1';
let livestockState = loadLivestockState();
let livestockFilter = 'all';
let pendingPhotoData = '';

function loadLivestockState(){
  try{
    const saved = JSON.parse(localStorage.getItem(LIVESTOCK_STORE_KEY));
    return saved && typeof saved === 'object' ? { items: [], ...saved } : { items: [] };
  } catch { return { items: [] }; }
}
function saveLivestockState(){ localStorage.setItem(LIVESTOCK_STORE_KEY, JSON.stringify(livestockState)); }
function readPhoto(file){
  return new Promise((resolve) => {
    if(!file){ resolve(''); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
function lifeTypeLabel(type){ return type === 'fish' ? 'Fish' : 'Coral'; }
function lifeScoreLabel(score){
  const n = Number(score || 5);
  if(n <= 3) return 'Review';
  if(n <= 6) return 'Watch';
  return 'Healthy';
}
function renderLivestock(){
  const grid = $('livestockGrid');
  if(!grid) return;
  const items = livestockState.items.filter(item => livestockFilter === 'all' || item.type === livestockFilter);
  if(!items.length){
    grid.innerHTML = '<div class="history-empty livestock-empty">No livestock saved yet. Add your first coral or fish to start the timeline.</div>';
    return;
  }
  grid.innerHTML = items.map(item => {
    const status = lifeScoreLabel(item.score);
    const tone = status === 'Healthy' ? 'good' : status === 'Watch' ? 'watch' : 'review';
    const img = item.photo ? `<img src="${item.photo}" alt="${escapeHtml(item.name)} photo" />` : `<div class="life-placeholder">${item.type === 'fish' ? '🐟' : '🪸'}</div>`;
    return `<article class="life-card ${tone}">
      <div class="life-image">${img}</div>
      <div class="life-content">
        <div class="life-top"><span>${lifeTypeLabel(item.type)}</span><button class="life-delete" data-id="${item.id}" type="button" aria-label="Delete ${escapeHtml(item.name)}">×</button></div>
        <h3>${escapeHtml(item.name)}</h3>
        <p class="life-location">${escapeHtml(item.location || 'Location not set')}</p>
        <div class="life-meter"><span style="width:${Number(item.score) * 10}%"></span></div>
        <div class="life-status"><strong>${status}</strong><small>${Number(item.score)}/10 growth / condition</small></div>
        <p class="life-note">${escapeHtml(item.notes || 'No notes yet.')}</p>
        <small class="life-date">Saved ${formatDate(item.date)}</small>
      </div>
    </article>`;
  }).join('');
  grid.querySelectorAll('.life-delete').forEach(btn => btn.addEventListener('click', () => {
    if(!confirm('Remove this livestock entry?')) return;
    livestockState.items = livestockState.items.filter(item => item.id !== btn.dataset.id);
    saveLivestockState();
    renderLivestock();
  }));
}
function escapeHtml(value){
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function bindLivestock(){
  const focus = $('livestockFocusBtn');
  if(focus) focus.addEventListener('click', () => $('livestockEntry').scrollIntoView({ behavior:'smooth', block:'start' }));
  const score = $('lifeScore');
  if(score) score.addEventListener('input', () => { $('lifeScoreText').textContent = `${score.value} / 10`; });
  const type = $('lifeType');
  if(type) type.addEventListener('change', () => { $('lifeSliderLabel').textContent = type.value === 'fish' ? 'Condition / confidence' : 'Growth / condition'; });
  const photo = $('lifePhoto');
  if(photo) photo.addEventListener('change', async () => {
    pendingPhotoData = await readPhoto(photo.files && photo.files[0]);
    const preview = $('photoPreview');
    if(pendingPhotoData) preview.innerHTML = `<img src="${pendingPhotoData}" alt="Selected livestock preview" />`;
    else preview.textContent = 'Photo preview appears here';
  });
  document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    livestockFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    renderLivestock();
  }));
  const form = $('livestockForm');
  if(form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('lifeName').value.trim();
      if(!name){ $('lifeSaveMsg').textContent = 'Add a name first.'; return; }
      if(!pendingPhotoData && $('lifePhoto').files && $('lifePhoto').files[0]) pendingPhotoData = await readPhoto($('lifePhoto').files[0]);
      const item = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: new Date().toISOString(),
        type: $('lifeType').value,
        name,
        location: $('lifeLocation').value.trim(),
        score: Number($('lifeScore').value || 5),
        notes: $('lifeNotes').value.trim(),
        photo: pendingPhotoData
      };
      livestockState.items.unshift(item);
      livestockState.items = livestockState.items.slice(0, 60);
      saveLivestockState();
      form.reset();
      pendingPhotoData = '';
      $('lifeScore').value = 5;
      $('lifeScoreText').textContent = '5 / 10';
      $('lifeSliderLabel').textContent = 'Growth / condition';
      $('photoPreview').textContent = 'Photo preview appears here';
      $('lifeSaveMsg').textContent = 'Livestock saved ✓';
      renderLivestock();
      setTimeout(() => $('lifeSaveMsg').textContent = '', 2400);
    });
  }
}

bindLivestock();
renderLivestock();
