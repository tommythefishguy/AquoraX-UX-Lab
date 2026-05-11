(function(){
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const store={get:(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
  let lastPage='home';
  function menu(open){$('#sideMenu').classList.toggle('open',open);$('#scrim').classList.toggle('show',open)}
  function showPage(id){const current=$('.page.active'); if(current&&current.id!==id) lastPage=current.id; $$('.page').forEach(p=>p.classList.toggle('active',p.id===id)); $$('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id)); menu(false); window.scrollTo({top:0,behavior:'smooth'}); renderAll();}
  $$('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
  $$('[data-back]').forEach(b=>b.addEventListener('click',()=>showPage(lastPage||'home')));
  $('#menuBtn').addEventListener('click',()=>menu(true)); $('#closeMenu').addEventListener('click',()=>menu(false)); $('#scrim').addEventListener('click',()=>menu(false)); document.addEventListener('keydown',e=>{if(e.key==='Escape')menu(false)});

  const labels={ammonia:'Ammonia',nitrite:'Nitrite',nitrate:'Nitrate',phosphate:'Phosphate',alk:'Alkalinity',calcium:'Calcium',magnesium:'Magnesium'};
  function guidance(t){ if(!t) return 'Add your first water test to see beginner-safe guidance.'; const a=+t.ammonia||0,n=+t.nitrite||0,no=+t.nitrate||0,p=+t.phosphate||0; if(a>0||n>0) return 'Review ammonia and nitrite again soon. Consider holding sensitive livestock additions until readings look stable.'; if(no>40||p>.15) return 'Nutrients look elevated. Watch trends, review feeding and consider normal maintenance checks.'; return 'Core signals look calm. Keep watching stability and record the next test so AquoraX can spot trends.'; }
  function renderTests(){ const tests=store.get('aquorax_tests',[]); const latest=tests[0]; $('#homeGuidance').textContent=guidance(latest); $('#homeParams').innerHTML= latest ? Object.keys(labels).map(k=>`<div class="param-card"><span>${labels[k]}</span><b>${latest[k]||'—'}</b></div>`).join('') : '<p class="muted">No water test saved yet.</p>'; $('#testList').classList.toggle('empty',!tests.length); $('#testList').innerHTML= tests.length ? tests.map(t=>`<div class="entry"><b>${new Date(t.date).toLocaleString()}</b><small>${Object.entries(labels).map(([k,l])=>`${l}: ${t[k]||'—'}`).join(' · ')}</small></div>`).join('') : 'No tests yet.'; }
  $('#testForm').addEventListener('submit',e=>{e.preventDefault(); const fd=new FormData(e.currentTarget); const t={date:new Date().toISOString()}; Object.keys(labels).forEach(k=>t[k]=fd.get(k)); const tests=store.get('aquorax_tests',[]); tests.unshift(t); store.set('aquorax_tests',tests.slice(0,20)); e.currentTarget.reset(); renderTests(); showPage('home');});

  function renderLivestock(){ const items=store.get('aquorax_livestock',[]); $('#livestockList').classList.toggle('empty',!items.length); $('#livestockList').innerHTML=items.length?items.map(i=>`<div class="entry"><b>${i.name} · ${i.type}</b><small>Condition ${i.condition}/10 · ${new Date(i.date).toLocaleString()}</small><p>${i.notes||'No notes added.'}</p></div>`).join(''):'No observations yet.'; }
  $('#conditionSlider').addEventListener('input',e=>$('#conditionValue').textContent=e.target.value);
  $('#livestockForm').addEventListener('submit',e=>{e.preventDefault(); const fd=new FormData(e.currentTarget); const item={date:new Date().toISOString(),name:fd.get('name'),type:fd.get('type'),condition:fd.get('condition'),notes:fd.get('notes')}; const items=store.get('aquorax_livestock',[]); items.unshift(item); store.set('aquorax_livestock',items); e.currentTarget.reset(); $('#conditionValue').textContent='5'; renderLivestock();});

  function preview(input,imgId,slot){ input.addEventListener('change',e=>{const f=e.target.files&&e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{localStorage.setItem(slot,r.result); $(imgId).src=r.result}; r.readAsDataURL(f);}); }
  preview($('#takePhoto'),'#currentPreview','aquorax_current_photo'); preview($('#uploadPhoto'),'#beforePreview','aquorax_before_photo');
  function renderPhotos(){ $('#beforePreview').src=localStorage.getItem('aquorax_before_photo')||''; $('#currentPreview').src=localStorage.getItem('aquorax_current_photo')||''; }
  $('#askBtn').addEventListener('click',()=>{const q=$('#askInput').value.trim(); $('#askOutput').textContent=q?`Review this calmly: ${q}. Consider checking recent water tests, livestock behaviour and stability trends before making changes. Avoid sudden adjustments unless you have confirmed readings.`:'Ask a question to get calm beginner guidance.'});
  function renderAll(){renderTests();renderLivestock();renderPhotos()}
  renderAll();
})();
