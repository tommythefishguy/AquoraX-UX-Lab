/* AquoraX UX Lab Mode
   Purpose: make the sandbox repo fast and safe for UI experiments.
   This file disables live cloud/auth/PWA hooks without deleting the production code paths. */
(function(){
  const LAB_SESSION = {
    uid: 'ux-lab-local-user',
    email: 'uxlab@aquorax.local',
    signedInAt: new Date().toISOString(),
    provider: 'ux-lab-local'
  };

  function $(id){ return document.getElementById(id); }

  try{
    localStorage.setItem('aquoraxCloudSession', JSON.stringify(LAB_SESSION));
    localStorage.setItem('aquoraxWelcomeSeen', 'yes');
    localStorage.setItem('aquoraxUxLabMode', 'enabled');
  }catch(e){}

  document.documentElement.classList.add('aqxUxLabMode');
  if(document.body) document.body.classList.add('aqxLoggedIn','aqxUxLabMode');

  // Replace Firebase init/sign-in calls with safe local UX-lab behaviour.
  window.aqxInitFirebase = function(){ return false; };
  window.aqxCloudUser = function(){ return LAB_SESSION; };
  window.aqxCloudUid = function(){ return LAB_SESSION.uid; };
  window.aqxSignIn = function(){ aqxUxLabNotice('Login is disabled in UX Lab. The app opens locally for fast UI testing.'); };
  window.aqxCreateAccount = function(){ aqxUxLabNotice('Account creation is disabled in UX Lab. Use the production repo for real cloud testing.'); };
  window.aqxSignOut = function(){ aqxUxLabNotice('Sign out is disabled in UX Lab so you cannot lock yourself out while designing.'); };
  window.aqxManualBackup = function(){ aqxUxLabNotice('Cloud backup is disabled in UX Lab. Local browser data still works for UI testing.'); };
  window.aqxManualRestore = function(){ aqxUxLabNotice('Cloud restore is disabled in UX Lab. Production cloud logic stays protected in the live repo.'); };
  window.aqxQueueCloudBackup = function(){ return false; };
  window.aqxDoCloudBackup = async function(){ return false; };
  window.aqxAutoRestoreOnLogin = async function(){ return false; };
  window.aqxCheckNotificationsNow = function(){ return false; };
  window.aqxEnableNotifications = function(){ aqxUxLabNotice('Notifications are disabled in UX Lab.'); };
  window.aqxRefreshFcmToken = async function(){ return false; };

  window.aqxUxLabNotice = function(message){
    const old = $('aqxUxLabToast');
    if(old) old.remove();
    const toast = document.createElement('div');
    toast.id = 'aqxUxLabToast';
    toast.className = 'aqxUxLabToast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(()=>toast.classList.add('show'), 20);
    setTimeout(()=>{ toast.classList.remove('show'); setTimeout(()=>toast.remove(), 350); }, 3500);
  };

  function unlockLab(){
    try{ document.body.classList.add('aqxLoggedIn','aqxUxLabMode'); }catch(e){}
    const login = $('aqxLoginScreen');
    if(login){ login.classList.remove('show'); login.style.display = 'none'; }
    const welcome = $('welcomeScreen');
    if(welcome){ welcome.style.display = 'none'; }
    const cloudBtn = $('aqxCloudButton');
    if(cloudBtn){ cloudBtn.style.display = 'none'; }
    const cloudHome = $('aqxCloudHomeBtn');
    if(cloudHome){ cloudHome.textContent = 'UX Lab'; cloudHome.onclick = function(){ aqxUxLabNotice('UX Lab mode: cloud/login/PWA systems are disabled for safe design testing.'); }; }

    if(!$('aqxUxLabBadge')){
      const badge = document.createElement('button');
      badge.id = 'aqxUxLabBadge';
      badge.className = 'aqxUxLabBadge';
      badge.type = 'button';
      badge.textContent = 'UX LAB';
      badge.onclick = function(){ aqxUxLabNotice('Safe sandbox: Firebase, cloud restore, notifications and service worker caching are disabled here.'); };
      document.body.appendChild(badge);
    }

    if(typeof window.openPage === 'function'){
      const active = document.querySelector('.page.active');
      if(!active) window.openPage('home');
    }
  }

  // Stop service worker/PWA caching in the sandbox and clear any old registrations on this origin.
  async function disableServiceWorkers(){
    try{
      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        regs.forEach(reg => reg.unregister().catch(()=>{}));
      }
    }catch(e){}
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ unlockLab(); disableServiceWorkers(); setTimeout(unlockLab, 400); setTimeout(unlockLab, 1200); });
  }else{
    unlockLab(); disableServiceWorkers(); setTimeout(unlockLab, 400); setTimeout(unlockLab, 1200);
  }
})();
