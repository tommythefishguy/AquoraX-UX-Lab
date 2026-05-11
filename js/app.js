(function(){
  const pages=document.querySelectorAll('.page'),navButtons=document.querySelectorAll('.nav-btn'),title=document.getElementById('pageTitle');
  const titles={home:'Beginner Home',livestock:'AquoraX Cam',journey:'Cycle Journey',tests:'Water Tests',settings:'Settings'};
  function showPage(id){pages.forEach(p=>p.classList.toggle('active',p.id===id));navButtons.forEach(b=>b.classList.toggle('active',b.dataset.page===id));if(title)title.textContent=titles[id]||'AquoraX';window.scrollTo({top:0,behavior:'smooth'});}
  navButtons.forEach(btn=>btn.addEventListener('click',()=>showPage(btn.dataset.page)));
  document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>showPage(btn.dataset.go)));
  document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));tab.classList.add('active');document.getElementById(tab.dataset.tab).classList.add('active');}));
  document.querySelectorAll('.photo-input').forEach(input=>input.addEventListener('change',e=>{
    const file=e.target.files&&e.target.files[0]; if(!file) return;
    const img=document.getElementById(input.dataset.target); if(!img) return;
    img.src=URL.createObjectURL(file);
    const stack=img.closest('.image-stack');
    if(input.dataset.target.includes('before')) stack.classList.add('has-before'); else stack.classList.add('has-current');
  }));
  document.querySelectorAll('.compare-range').forEach(range=>range.addEventListener('input',()=>{
    const current=document.getElementById(range.dataset.current);
    if(current) current.style.clipPath=`inset(0 0 0 ${range.value}%)`;
  }));
  const sheet=document.getElementById('assistantSheet'),open=document.getElementById('openAssistant'),close=document.getElementById('closeAssistant');
  if(open)open.addEventListener('click',()=>sheet.classList.add('open'));
  if(close)close.addEventListener('click',()=>sheet.classList.remove('open'));
})();