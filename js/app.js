
(function(){
  const pages = document.querySelectorAll('.page');
  const navButtons = document.querySelectorAll('.nav-btn');
  const title = document.getElementById('pageTitle');

  const titles = {
    home: 'Beginner Home',
    livestock: 'Livestock',
    journey: 'Cycle Journey',
    tests: 'Water Tests',
    settings: 'Settings'
  };

  function showPage(id){
    pages.forEach(p => p.classList.toggle('active', p.id === id));
    navButtons.forEach(b => b.classList.toggle('active', b.dataset.page === id));
    if(title) title.textContent = titles[id] || 'AquoraX';
    window.scrollTo({top:0, behavior:'smooth'});
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  document.querySelectorAll('[data-go]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.go));
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  const sheet = document.getElementById('assistantSheet');
  const open = document.getElementById('openAssistant');
  const close = document.getElementById('closeAssistant');
  if(open) open.addEventListener('click', () => sheet.classList.add('open'));
  if(close) close.addEventListener('click', () => sheet.classList.remove('open'));
})();
