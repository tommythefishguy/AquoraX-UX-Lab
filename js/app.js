(function(){
  const pages = document.querySelectorAll('.page');
  const controls = document.querySelectorAll('[data-page]');
  function showPage(id){
    pages.forEach(page => page.classList.toggle('active', page.id === id));
    controls.forEach(control => control.classList.toggle('active', control.dataset.page === id));
    window.scrollTo({top:0, behavior:'smooth'});
  }
  controls.forEach(control => control.addEventListener('click', () => showPage(control.dataset.page)));
})();