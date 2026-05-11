(function(){
  const pages = document.querySelectorAll('.page');
  const controls = document.querySelectorAll('[data-page]');
  function showPage(id){
    pages.forEach(page => page.classList.toggle('active', page.id === id));
    controls.forEach(control => control.classList.toggle('active', control.dataset.page === id));
    window.scrollTo({top:0, behavior:'smooth'});
  }
  controls.forEach(control => control.addEventListener('click', () => showPage(control.dataset.page)));

  function preview(inputId, previewId){
    const input = document.getElementById(inputId);
    const target = document.getElementById(previewId);
    if(!input || !target) return;
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if(!file) return;
      const img = document.createElement('img');
      img.alt = 'AquoraX Cam preview';
      img.src = URL.createObjectURL(file);
      target.innerHTML = '';
      target.appendChild(img);
    });
  }
  preview('beforeInput','beforePreview');
  preview('currentInput','currentPreview');
})();
