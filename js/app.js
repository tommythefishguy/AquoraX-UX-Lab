const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));

const params = [
  {key:'temp', label:'Temperature', unit:'°C', ideal:'24–26', help:'Temperature affects every living thing in your reef. Aim for stability rather than constant adjustment.'},
  {key:'salinity', label:'Salinity', unit:'ppt', ideal:'34–35', help:'Salinity is how salty your reef water is. Corals and fish dislike sudden swings.'},
  {key:'ph', label:'pH', unit:'', ideal:'7.8–8.4', help:'pH shows how acidic or alkaline the water is. Daily movement is normal, trends matter more.'},
  {key:'alk', label:'Alkalinity', unit:'dKH', ideal:'7–10', help:'Alkalinity supports coral skeleton growth and helps keep pH stable.'},
  {key:'calcium', label:'Calcium', unit:'ppm', ideal:'400–450', help:'Calcium helps stony corals and coralline algae build skeletons.'},
  {key:'magnesium', label:'Magnesium', unit:'ppm', ideal:'1250–1400', help:'Magnesium helps balance alkalinity and calcium in reef water.'},
  {key:'nitrate', label:'Nitrate', unit:'ppm', ideal:'2–25', help:'Nitrate is produced naturally by fish waste and feeding. Too little or too much can be worth reviewing.'},
  {key:'phosphate', label:'Phosphate', unit:'ppm', ideal:'0.03–0.10', help:'Phosphate is a nutrient. Stability matters and sudden changes can upset corals.'}
];
const help = {
  home:['Beginner Home','This page answers the simple question: is my reef okay, what needs attention, and what should I do next?'],
  attention:['What needs attention','These cards translate test results and app activity into calm guidance. AquoraX avoids panic wording and focuses on what to review.'],
  cycle:['Why cycle tracking matters','A new reef needs time to build bacteria that process waste. Tracking ammonia, nitrite and nitrate helps you add livestock more safely.']
};
let activeLivestockTab = localStorage.getItem('aqxBeginnerLivestockTab') || 'corals';

function loadTests(){ return JSON.parse(localStorage.getItem('aqxBeginnerTests')||'[]'); }
function saveTests(t){ localStorage.setItem('aqxBeginnerTests', JSON.stringify(t)); }
function loadLivestock(){ return JSON.parse(localStorage.getItem('aqxBeginnerLivestock')||'[]'); }
function saveLivestock(v){ localStorage.setItem('aqxBeginnerLivestock', JSON.stringify(v)); }

function go(page){
  $$('.page').forEach(p=>p.classList.toggle('active', p.id===page));
  $$('.bottom-nav button').forEach(b=>b.classList.toggle('active', b.dataset.go===page));
  $('#sideMenu').classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});
}
function statusFor(param, value){
  if(value === '' || value == null || Number.isNaN(Number(value))) return 'tracking';
  value = Number(value);
  const ranges = {
    temp:[24,26,23,27], salinity:[34,35,33,36], ph:[7.8,8.4,7.6,8.5], alk:[7,10,6.5,11],
    calcium:[400,450,380,470], magnesium:[1250,1400,1200,1450], nitrate:[2,25,0,40], phosphate:[0.03,0.10,0.01,0.18]
  }[param.key];
  if(!ranges) return 'tracking';
  const [lo,hi,watchLo,watchHi]=ranges;
  if(value>=lo && value<=hi) return 'stable';
  if(value>=watchLo && value<=watchHi) return 'review';
  return 'urgent';
}
function statusText(status){ return {stable:'Stable',review:'Review',urgent:'Urgent',tracking:'Tracking'}[status]||'Tracking'; }
function statusCopy(status,label){
  if(status==='stable') return `${label} is sitting in a beginner-friendly range.`;
  if(status==='review') return `${label} may be worth watching on your next test.`;
  if(status==='urgent') return `${label} is outside the simple guide range. Consider checking again and reviewing slowly.`;
  return `${label} will appear here after your next saved test.`;
}
function latest(){ const t=loadTests(); return t[t.length-1] || {}; }
function renderHome(){
  const last = latest();
  const has = !!last.date;
  const statuses = params.map(p=>statusFor(p,last[p.key]));
  const urgent = statuses.filter(s=>s==='urgent').length;
  const review = statuses.filter(s=>s==='review').length;
  const stable = statuses.filter(s=>s==='stable').length;
  const overall = !has ? 'Tracking' : urgent ? 'Urgent' : review ? 'Review' : 'Stable';
  $('#stabilityStatus').textContent = overall;
  $('#reefSummary').textContent = !has ? 'Start by logging your first water test. AquoraX will turn numbers into simple guidance.' :
    urgent ? 'One or more readings need careful review. Re-test before making big changes.' :
    review ? 'A few readings are worth watching. Keep changes slow and track the trend.' :
    'Your latest readings look stable. Keep your normal care rhythm going.';
  const stack = $('#attentionStack');
  const cards = [];
  if(!has) cards.push(['tracking','First test needed','Log your first water test to unlock reef guidance.']);
  else {
    cards.push([overall.toLowerCase(),`${overall} reef overview`, `${stable} stable · ${review} review · ${urgent} urgent`]);
    const nitr = params.find(p=>p.key==='nitrate'), phos=params.find(p=>p.key==='phosphate');
    cards.push([statusFor(nitr,last.nitrate), 'Nutrients', statusCopy(statusFor(nitr,last.nitrate),'Nitrate')]);
    cards.push([statusFor(phos,last.phosphate), 'Phosphate', statusCopy(statusFor(phos,last.phosphate),'Phosphate')]);
  }
  cards.push(['tracking','Jobs & routine','Use Jobs to remember testing, water changes, feeding and maintenance.']);
  stack.innerHTML = cards.map(([s,t,b])=>`<div class="attention-card ${s}"><i class="status-dot"></i><div><strong>${t}</strong><p class="muted">${b}</p></div></div>`).join('');
  $('#homeParamGrid').innerHTML = params.map(p=>{
    const value = has && last[p.key]!=='' && last[p.key]!=null ? `${last[p.key]}${p.unit?` ${p.unit}`:''}` : '--';
    const s=statusFor(p,last[p.key]);
    return `<button class="param-card ${s}" data-param-help="${p.key}"><strong>${p.label}</strong><span>${value}</span><small>${statusText(s)} · guide ${p.ideal}${p.unit?' '+p.unit:''}</small></button>`;
  }).join('');
}
function renderTests(){
  $('#testForm').innerHTML = params.map(p=>`<div class="test-row"><label>${p.label}<small>Guide ${p.ideal}${p.unit?' '+p.unit:''}</small></label><input inputmode="decimal" id="test-${p.key}" placeholder="--" /><button class="info-dot" data-param-help="${p.key}">?</button></div>`).join('');
  $('#parameterGuide').innerHTML = params.map(p=>`<button class="guide-item" data-param-help="${p.key}"><strong>${p.label}</strong><span>${p.help}</span></button>`).join('');
}
function renderLivestock(){
  $$('.tab').forEach(t=>t.classList.toggle('active', t.dataset.livestockTab===activeLivestockTab));
  const items = loadLivestock().filter(i=>i.type===activeLivestockTab);
  $('#livestockList').innerHTML = items.length ? items.map((i,idx)=>`<div class="livestock-card"><strong>${i.name}</strong><span>${i.status} · ${i.notes||'No notes yet.'}</span><button class="small-link" data-remove-live="${idx}">Remove</button></div>`).join('') : `<div class="attention-card"><i class="status-dot"></i><div><strong>No ${activeLivestockTab} added yet</strong><p class="muted">Add your first ${activeLivestockTab==='corals'?'coral':'fish'} to start simple care tracking.</p></div></div>`;
}
function openParamHelp(key){
  const p=params.find(x=>x.key===key); if(!p) return;
  $('#helpTitle').textContent=p.label;
  $('#helpBody').textContent=`${p.help} Beginner guide range: ${p.ideal}${p.unit?' '+p.unit:''}. Stability matters more than chasing a perfect number.`;
  $('#helpModal').classList.add('open');
}
function askAnswer(q){
  q=q.toLowerCase();
  if(q.includes('alk')) return 'Alkalinity helps keep reef water stable and supports coral skeleton growth. Test it regularly and avoid sudden swings.';
  if(q.includes('nitrate')) return 'Nitrate is a nutrient created by feeding and waste. Beginner goal: keep it stable and avoid huge changes.';
  if(q.includes('phosphate')) return 'Phosphate is another nutrient. Too much can fuel algae, but zero can upset corals. Watch the trend.';
  if(q.includes('cycle')) return 'Cycling is the process of building bacteria that handle waste. Track ammonia, nitrite and nitrate before adding livestock quickly.';
  if(q.includes('coral')) return 'For beginner coral care, focus on stable salinity, temperature, alkalinity, nutrients and gentle changes.';
  if(q.includes('fish')) return 'For fish, add slowly, avoid overcrowding, monitor behaviour and keep testing after new additions.';
  if(q.includes('where')||q.includes('find')) return 'Use the bottom nav: Home for overview, Tests to log water, Livestock for coral/fish, Journey for cycle guidance, Settings for preferences.';
  return 'I can help explain reef terms, water tests, cycle stages, coral care, fish care and where to find things in AquoraX. For exact dosing or emergencies, check product instructions and trusted reef advice.';
}
function init(){
  renderTests(); renderHome(); renderLivestock();
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
  $('#menuBtn').onclick=()=>$('#sideMenu').classList.add('open');
  $('#closeMenu').onclick=()=>$('#sideMenu').classList.remove('open');
  $('#closeHelp').onclick=()=>$('#helpModal').classList.remove('open');
  $('#helpModal').onclick=e=>{ if(e.target.id==='helpModal') $('#helpModal').classList.remove('open'); };
  document.addEventListener('click',e=>{
    const ph=e.target.closest('[data-param-help]'); if(ph) openParamHelp(ph.dataset.paramHelp);
    const h=e.target.closest('[data-help]'); if(h){ const [t,b]=help[h.dataset.help]||['AquoraX help','This area includes simple guidance for beginner reef keepers.']; $('#helpTitle').textContent=t; $('#helpBody').textContent=b; $('#helpModal').classList.add('open'); }
  });
  $('#saveTest').onclick=()=>{
    const entry={date:new Date().toISOString()}; params.forEach(p=>entry[p.key]=$(`#test-${p.key}`).value.trim());
    const tests=loadTests(); tests.push(entry); saveTests(tests); renderHome(); go('home');
  };
  $$('.tab').forEach(t=>t.onclick=()=>{activeLivestockTab=t.dataset.livestockTab; localStorage.setItem('aqxBeginnerLivestockTab', activeLivestockTab); renderLivestock();});
  $('#addLivestock').onclick=()=>{ const name=$('#livestockName').value.trim(); if(!name) return; const items=loadLivestock(); items.push({type:activeLivestockTab,name,status:$('#livestockStatus').value,notes:$('#livestockNotes').value.trim()}); saveLivestock(items); $('#livestockName').value=''; $('#livestockNotes').value=''; renderLivestock(); };
  $('#livestockList').addEventListener('click',e=>{ const btn=e.target.closest('[data-remove-live]'); if(!btn) return; const all=loadLivestock(); const visible=all.map((x,i)=>({...x,_i:i})).filter(x=>x.type===activeLivestockTab); all.splice(visible[Number(btn.dataset.removeLive)]._i,1); saveLivestock(all); renderLivestock(); });
  $$('[data-open-assistant]').forEach(b=>b.onclick=()=>$('#assistant').classList.add('open'));
  $('#closeAssistant').onclick=()=>$('#assistant').classList.remove('open');
  $('#askSend').onclick=()=>{ const input=$('#askInput'); const q=input.value.trim(); if(!q) return; $('#chat').insertAdjacentHTML('beforeend',`<div class="bubble user">${q.replace(/[<>]/g,'')}</div><div class="bubble bot">${askAnswer(q)}</div>`); input.value=''; $('#chat').scrollTop=$('#chat').scrollHeight; };
  $('#askInput').addEventListener('keydown',e=>{ if(e.key==='Enter') $('#askSend').click(); });
  $('#toggleGlow').onclick=()=>document.body.classList.toggle('soft-glow-off');
  $('#clearData').onclick=()=>{ localStorage.removeItem('aqxBeginnerTests'); localStorage.removeItem('aqxBeginnerLivestock'); renderHome(); renderLivestock(); };
}
document.addEventListener('DOMContentLoaded', init);
