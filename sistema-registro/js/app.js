// ── NAVEGACIÓN (sincroniza nav desktop + bottom nav mobile) ──
function mostrarPagina(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  ['nav-','bottom-'].forEach(prefix => {
    document.querySelectorAll(`[id^="${prefix}"]`).forEach(b => b.classList.remove('active'));
    const el = document.getElementById(prefix + id);
    if (el) el.classList.add('active');
  });
  document.getElementById('page-' + id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (id === 'fallecidos') Fallecidos.cargarListado();
  if (id === 'cocode') Cocode.cargarListado();
  if (id === 'inicio') cargarEstadisticas();
}

// ── ESTADÍSTICAS ──
async function cargarEstadisticas() {
  try {
    const [snapF, snapC] = await Promise.all([
      db.collection('fallecidos').get(),
      db.collection('cocode').get()
    ]);
    document.getElementById('stat-fallecidos').textContent = snapF.size;
    document.getElementById('stat-cocode').textContent = snapC.size;
    const locs = new Set();
    snapF.docs.forEach(d => { if (d.data().localidad) locs.add(d.data().localidad.toLowerCase()); });
    snapC.docs.forEach(d => { if (d.data().localidad) locs.add(d.data().localidad.toLowerCase()); });
    document.getElementById('stat-localidades').textContent = locs.size;
  } catch(e) { console.error(e); }
}

// ── UTILIDAD: MENSAJES ──
function mostrarMsg(el, texto, tipo) {
  if (!el) return;
  el.className = `msg msg-${tipo} show`;
  el.innerHTML = texto;
  setTimeout(() => el.classList.remove('show'), 4500);
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  Fallecidos.initPreview();
  Cocode.initPreview();
  cargarEstadisticas();
});
