
(function(){
  const pages=[...document.querySelectorAll('.page')];
  const controls=[...document.querySelectorAll('[data-page]')];
  const rail=document.getElementById('sideRail');
  const toggle=document.getElementById('navToggle');
  const scrim=document.getElementById('navScrim');
  function setMenu(open){rail.classList.toggle('open',open);scrim.classList.toggle('show',open);toggle.textContent=open?'×':'☰';toggle.setAttribute('aria-label',open?'Close menu':'Open menu')}
  function showPage(id){
    pages.forEach(p=>p.classList.toggle('active',p.id===id));
    controls.forEach(c=>c.classList.toggle('active',c.dataset.page===id));
    setMenu(false);
    window.scrollTo({top:0,behavior:'smooth'});
  }
  controls.forEach(c=>c.addEventListener('click',()=>showPage(c.dataset.page)));
  toggle.addEventListener('click',()=>setMenu(!rail.classList.contains('open')));
  scrim.addEventListener('click',()=>setMenu(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
})();
