(function(){
  const { DateTime } = luxon;
  // Ajusta la fecha objetivo a la zona de llegada
  const TARGET_ZONE = 'America/Los_Angeles';
  const TARGET_DT   = DateTime.fromObject({ year: 2025, month: 9, day: 22, hour: 11, minute: 35 }, { zone: TARGET_ZONE });
  const TARGET_MS   = TARGET_DT.toUTC().toMillis();

  const els = { d:$('#d'), h:$('#h'), m:$('#m'), s:$('#s'),
                viewCount:$('#countdownView'), viewAfter:$('#afterView'),
                targetLA:$('#target-la'), targetLocal:$('#target-local'), tzInfo:$('#tzInfo') };

  // Render de fechas en ambas zonas
  const fmtLA = TARGET_DT.toFormat("ccc, dd LLL yyyy · hh:mm a 'PDT'");
  const local = DateTime.fromMillis(TARGET_MS).setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const fmtLocal = local.toFormat("ccc, dd LLL yyyy · hh:mm a ZZZZ");
  els.targetLA.textContent = fmtLA;
  els.targetLocal.textContent = fmtLocal;
  els.tzInfo.textContent = `Zona objetivo: ${TARGET_ZONE} · Tu zona: ${local.zoneName}`;

  // Notificaciones
  const btnNotify = $('#btnNotify');
  const btnTest   = $('#btnTest');
  const btnCopy   = $('#btnCopy');

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
    if(!('Notification' in window)) return alert('Tu navegador no soporta notificaciones.');
    if(Notification.permission === 'granted'){
      notifyNow('🔔 Notificaciones activadas', 'Te avisaré conforme se acerque la hora.');
      scheduleMilestones();
      btnNotify.disabled = true; btnNotify.textContent = 'Notificaciones activadas';
      return;
    }
    Notification.requestPermission().then(p => {
      if(p === 'granted'){
        notifyNow('🔔 Notificaciones activadas', 'Te avisaré conforme se acerque la hora.');
        scheduleMilestones();
        btnNotify.disabled = true; btnNotify.textContent = 'Notificaciones activadas';
      } else if(p === 'denied'){
        alert('Has bloqueado las notificaciones. Puedes habilitarlas en la configuración del navegador.');
      }
    });
  }

  btnNotify.addEventListener('click', askPermissionAndSchedule);
  btnTest.addEventListener('click', () => notifyNow('Prueba de notificación', 'Se ve y se escucha bien.'));
  btnCopy.addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(location.href);
      toast('Enlace copiado al portapapeles');
    }catch(e){ toast('No se pudo copiar.'); }
  });

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

  // Compartir
  $('#btnShare').addEventListener('click', async ()=>{
    const shareData = { title:'Cuenta regresiva · Nuestro reencuentro', text:'Cuenta atrás para verte de nuevo', url: location.href };
    try{
      if(navigator.share){ await navigator.share(shareData); }
      else{ await navigator.clipboard.writeText(shareData.url); toast('Enlace copiado para compartir'); }
    }catch(e){ /* usuario canceló */ }
  });

  // Mostrar nuevamente el contador (para pruebas)
  $('#btnReplay').addEventListener('click', ()=>{
    $('#afterView').style.display='none';
    $('#countdownView').style.display='block';
    start();
  });

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
  if(Date.now() >= TARGET_MS){
    $('#countdownView').style.display='none';
    $('#afterView').style.display='block';
  } else {
    start();
  }
})();
