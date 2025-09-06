(function(){
  const { DateTime } = luxon;
  // Ajusta la fecha objetivo a la zona de llegada
  const TARGET_ZONE = 'America/Los_Angeles';
  const TARGET_DT   = DateTime.fromObject({ year: 2025, month: 9, day: 22, hour: 11, minute: 35 }, { zone: TARGET_ZONE });
  const TARGET_MS   = TARGET_DT.toUTC().toMillis();

  const els = { d:$('#d'), h:$('#h'), m:$('#m'), s:$('#s'),
                viewCount:$('#countdownView'), viewAfter:$('#afterView') };

  // Frases aleatorias para el subtítulo
  const SUBTITLE_EL = document.getElementById('subtitleRandom');
  if (SUBTITLE_EL) {
    const phrases = [
      'Cuestión de tiempo, preciosa 👀',
      'Cada segundo nos acerca más ✨',
      'El tiempo corre a nuestro favor ⏳',
      'Ya casi nos abrazamos 🤗',
      'Ya casi nos damos besos con sabor a Cerveza ❤️',
      'Falta poquito, mi mapacha 🦝',
      'LLegando no te pararé de consentir 🥰',
      'Una cuenta regresiva para dos 💞',
      'Preparando el abrazo más largo 💋',
      'Nuestra historia continúa en... 3, 2, 1 💖',
      "Me voy a pegar con cola loca a ti 🌚",
      "Te voy a dar masaje hasta que se me caigan las manos 👹"
    ];
    const pick = phrases[Math.floor(Math.random()*phrases.length)];
    SUBTITLE_EL.textContent = pick;
  }

  // Notificaciones
  const btnNotify = $('#btnNotify');
  const btnDismiss = $('#btnDismiss');
  const btnTest = $('#btnTest'); // Puede ser null si no existe
  const notificationRibbon = $('#notificationRibbon');
  const ribbonText = document.querySelector('.ribbon-text');
  const DEV = /\bdev=1\b/i.test(location.search) || localStorage.getItem('devMode') === '1';
  // Flag para forzar el estado final de la cuenta
  const FIN = /\bfin=1\b/i.test(location.search) || localStorage.getItem('finMode') === '1';

  // Si no es DEV y existe un botón de prueba en el DOM, ocultarlo
  if(!DEV && btnTest){
    btnTest.style.display = 'none';
  }

  if (DEV) {
    console.log('[DEV] Modo desarrollo activo para notificaciones');
    // Atajo para probar en consola
    window.devNotify = (title='Prueba DEV', body='Notificación de prueba') => notifyNow(title, body);
    // Crear botón de prueba si no existe
    if(!btnTest){
      const rb = document.querySelector('.ribbon-buttons');
      if(rb){
        const b = document.createElement('button');
        b.id = 'btnTest';
        b.className = 'ribbon-btn secondary';
        b.textContent = 'Probar notificación';
        b.addEventListener('click', ()=> {
          if(Notification.permission !== 'granted'){
            askPermissionAndSchedule();
          } else {
            notifyNow('Prueba de notificación', 'Se ve y se escucha bien.');
          }
        });
        rb.appendChild(b);
      }
    }
    // Atajo de teclado: Cmd/Ctrl + T
    window.addEventListener('keydown', (e)=>{
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't'){
        if(Notification.permission !== 'granted'){
          askPermissionAndSchedule();
        } else {
          notifyNow('Prueba de notificación', 'Se ve y se escucha bien.');
        }
      }
    });
  }

  const MILESTONES = [
    { ms: 24*60*60*1000, title: 'Falta 1 día 💓', body: 'Mañana por fin nos abrazamos.' },
    { ms: 60*60*1000,     title: 'Falta 1 hora ⏳', body: 'Prepárate para mi llegada.' },
    { ms: 10*60*1000,     title: 'Faltan 10 minutos 🔟', body: 'Estoy a punto de aterrizar.' },
  ];

  function notifyNow(title, body){
    if(!('Notification' in window)) return alert('Tu navegador no soporta notificaciones');
    if(Notification.permission === 'granted'){
      try{
        new Notification(title, { body, tag:'countdown', renotify:true });
      }catch(e){ console.warn(e); }
    }
  }

  function scheduleMilestones(){
    const now = Date.now();
    const remaining = TARGET_MS - now;
    MILESTONES.forEach(m => {
      const triggerIn = remaining - m.ms;
      if(triggerIn > 0){
        setTimeout(() => notifyNow(m.title, m.body), triggerIn);
      }
    });
    // Notificación final
    if(remaining > 0) setTimeout(() => {
      notifyNow('¡Ya estoy aquí! ❤️', 'La espera terminó.');
    }, remaining);
  }

  function askPermissionAndSchedule(){
    if(!('Notification' in window)) return;
    if(Notification.permission === 'granted'){
      scheduleMilestones();
      hideNotificationRibbon();
      return;
    }
    Notification.requestPermission().then(p => {
      if(p === 'granted'){
        notifyNow('🔔 Notificaciones activadas', 'Te avisaré conforme se acerque la hora.');
        scheduleMilestones();
        hideNotificationRibbon();
      } else if(p === 'denied'){
        hideNotificationRibbon();
        alert('Has bloqueado las notificaciones. Puedes habilitarlas en la configuración del navegador.');
      }
    });
  }

  function showNotificationRibbon(){
    if(notificationRibbon) {
      notificationRibbon.classList.add('show');
      // Ajustar el padding inferior del body para que el contenido no quede tapado
      requestAnimationFrame(() => {
        const h = notificationRibbon.offsetHeight || 0;
        document.body.style.paddingBottom = `calc(${h}px + env(safe-area-inset-bottom))`;
      });
    }
  }

  function hideNotificationRibbon(){
    if(notificationRibbon) {
      notificationRibbon.classList.remove('show');
      // Quitar el padding extra cuando ya no esté visible
      document.body.style.paddingBottom = '';
    }
  }

  // Verificar permisos al cargar la página
  function checkNotificationPermissionOnLoad(){
    const supportsNotifications = ('Notification' in window);

    // Si está en modo FIN, no mostramos el ribbon ni pedimos permisos
    if (FIN) {
      hideNotificationRibbon();
      return;
    }

    if (DEV) {
      showNotificationRibbon();
      if(!supportsNotifications && ribbonText){
        ribbonText.textContent = 'ℹ️ Modo DEV: Este navegador no soporta notificaciones en este contexto.';
      }
      return;
    }

    if(!supportsNotifications){
      // iOS Safari (no PWA) u otros: mostrar ribbon informativo
      showNotificationRibbon();
      if(ribbonText){
        ribbonText.textContent = 'ℹ️ Tu navegador no soporta notificaciones aquí. En iPhone, añádelo a la pantalla de inicio (iOS 16.4+) para habilitarlas.';
      }
      btnNotify?.setAttribute('disabled','true');
      return;
    }
    
    if(Notification.permission === 'default'){
      showNotificationRibbon();
      btnNotify?.removeAttribute('disabled');
    } else if(Notification.permission === 'granted'){
      scheduleMilestones();
      hideNotificationRibbon();
    } else if(Notification.permission === 'denied'){
      // Mostrar ribbon con info para guiar
      showNotificationRibbon();
      if(ribbonText){
        ribbonText.textContent = '🔒 Notificaciones bloqueadas. Habilítalas en Ajustes del navegador para recibir avisos.';
      }
      btnNotify?.setAttribute('disabled','true');
    }
  }

  btnNotify?.addEventListener('click', askPermissionAndSchedule);
  btnDismiss?.addEventListener('click', hideNotificationRibbon);
  
  // Solo agregar el event listener si el botón existe
  if(btnTest) {
    btnTest.addEventListener('click', () => notifyNow('Prueba de notificación', 'Se ve y se escucha bien.'));
  }


  // Countdown loop
  let timer = null;
  function start(){
    stop();
    tick();
    timer = setInterval(tick, 1000);
  }
  function stop(){ if(timer) clearInterval(timer); }

  function tick(){
    const now = Date.now();
    let diff = TARGET_MS - now;
    if(diff <= 0){
    // if(true){

      // mostrar vista final
      els.viewCount.style.display = 'none';
      els.viewAfter.style.display = 'block';
      stop();
      confetti();
      return;
    }
    const d = Math.floor(diff / 86_400_000); diff -= d*86_400_000;
    const h = Math.floor(diff / 3_600_000);  diff -= h*3_600_000;
    const m = Math.floor(diff / 60_000);     diff -= m*60_000;
    const s = Math.floor(diff / 1_000);

    setNum(els.d, d);
    setNum(els.h, h);
    setNum(els.m, m);
    setNum(els.s, s);
  }

  function setNum(el, n){
    const val = String(n).padStart(2,'0');
    if(el.textContent !== val){
      el.textContent = val;
      el.animate([
        { transform:'translateY(0)', filter:'blur(0px)' },
        { transform:'translateY(-6px)', filter:'blur(0.6px)' },
        { transform:'translateY(0)', filter:'blur(0px)' }
      ], { duration: 260, easing:'ease-out' });
    }
  }

  // // Compartir
  // $('#btnShare').addEventListener('click', async ()=>{
  //   const shareData = { title:'Cuenta regresiva · Nuestro reencuentro', text:'Cuenta atrás para verte de nuevo', url: location.href };
  //   try{
  //     if(navigator.share){ await navigator.share(shareData); }
  //     else{ await navigator.clipboard.writeText(shareData.url); toast('Enlace copiado para compartir'); }
  //   }catch(e){ /* usuario canceló */ }
  // });

  // // Mostrar nuevamente el contador (para pruebas)
  // $('#btnReplay').addEventListener('click', ()=>{
  //   $('#afterView').style.display='none';
  //   $('#countdownView').style.display='block';
  //   start();
  // });

  // Utilidades UI
  function $(q){ return document.querySelector(q); }
  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);padding:10px 14px;border-radius:12px;background:rgba(75,29,79,.9);color:#ffe4e6;border:1px solid rgba(248,187,208,.35);z-index:60;box-shadow:0 8px 24px rgba(0,0,0,.35);';
    document.body.appendChild(t);
    setTimeout(()=> t.remove(), 1800);
  }

  // Confetti ligero con emojis
  function confetti(){
    const host = $('#confetti');
    host.innerHTML = '';
    const N = 120;
    for(let i=0;i<N;i++){
      const e = document.createElement('i');
      e.textContent = ['💖','💘','❤️','💞','💕'][Math.floor(Math.random()*5)];
      const size = 16 + Math.random()*18;
      e.style.left = Math.random()*100 + 'vw';
      e.style.top = '-10vh';
      e.style.fontSize = size + 'px';
      e.style.opacity = String(0.7 + Math.random()*0.3);
      const dx = (Math.random() - .5) * 40;
      const dur = 3.5 + Math.random()*2.5;
      e.animate([
        { transform:`translate(0,0) rotate(0deg)` },
        { transform:`translate(${dx}vw, 110vh) rotate(${Math.random()*360}deg)` }
      ], { duration: dur*1000, easing:'cubic-bezier(.2,.8,.2,1)', iterations:1, delay: Math.random()*1200 });
      host.appendChild(e);
      setTimeout(()=> e.remove(), dur*1000 + 1500);
    }
  }

  // Inicio
  if (FIN || Date.now() >= TARGET_MS){
    $('#countdownView').style.display='none';
    $('#afterView').style.display='block';
    // Mostrar confetti también en modo FIN para ver la sorpresa
    confetti();
  } else {
    start();
  }
  
  // Verificar permisos de notificación al cargar
  checkNotificationPermissionOnLoad();
})();
