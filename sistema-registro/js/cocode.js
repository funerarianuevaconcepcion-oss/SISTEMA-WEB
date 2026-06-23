// ================================================
// MÓDULO: COCODE
// ================================================

const Cocode = (() => {

  let editandoId = null;

  // ---- GUARDAR ----
  async function guardar() {
    const nombre = document.getElementById('c-nombre').value.trim();
    const cargo = document.getElementById('c-cargo').value.trim();
    const localidad = document.getElementById('c-localidad').value.trim();
    const telefono = document.getElementById('c-telefono').value.trim();
    const dpi = document.getElementById('c-dpi').value.trim();
    const msgEl = document.getElementById('c-msg');

    if (!nombre || !cargo || !localidad) {
      mostrarMsg(msgEl, '❌ Por favor llena nombre, cargo y localidad.', 'error');
      return;
    }

    const btn = document.getElementById('c-btn-guardar');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Guardando...';

    try {
      let fotoUrl = '';
      let fotoPath = '';
      const fileInput = document.getElementById('c-foto');

      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const path = `cocode/${Date.now()}_${file.name}`;
        const ref = storage.ref(path);
        const snap = await ref.put(file);
        fotoUrl = await snap.ref.getDownloadURL();
        fotoPath = path;
      }

      const datos = {
        nombre,
        cargo,
        localidad,
        telefono,
        dpi,
        correo: document.getElementById('c-correo').value.trim(),
        direccion: document.getElementById('c-direccion').value.trim(),
        notas: document.getElementById('c-notas').value.trim(),
        fotoUrl,
        fotoPath,
        activo: true,
        creadoEn: firebase.firestore.FieldValue.serverTimestamp(),
        actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (editandoId) {
        await db.collection('cocode').doc(editandoId).update({
          ...datos,
          actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
        });
        mostrarMsg(msgEl, '✅ Registro COCODE actualizado.', 'success');
        editandoId = null;
        btn.textContent = '💾 Guardar Miembro';
      } else {
        await db.collection('cocode').add(datos);
        mostrarMsg(msgEl, '✅ Miembro COCODE registrado.', 'success');
      }

      limpiarFormulario();
      cargarListado();

    } catch (err) {
      console.error(err);
      mostrarMsg(msgEl, '❌ Error: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      if (!editandoId) btn.innerHTML = '💾 Guardar Miembro';
    }
  }

  // ---- CARGAR LISTADO ----
  async function cargarListado() {
    const contenedor = document.getElementById('c-lista');
    const busqueda = document.getElementById('c-buscar').value.toLowerCase();
    const filtroLocalidad = document.getElementById('c-filtro-localidad').value.toLowerCase();
    const filtroCargo = document.getElementById('c-filtro-cargo').value.toLowerCase();

    contenedor.innerHTML = '<div class="empty-state"><span class="loader" style="width:32px;height:32px;border-color:#1a3a6b33;border-top-color:#1a3a6b"></span></div>';

    try {
      const snapshot = await db.collection('cocode').orderBy('localidad').get();
      let docs = snapshot.docs;

      if (busqueda) docs = docs.filter(d => d.data().nombre.toLowerCase().includes(busqueda));
      if (filtroLocalidad) docs = docs.filter(d => d.data().localidad.toLowerCase().includes(filtroLocalidad));
      if (filtroCargo) docs = docs.filter(d => d.data().cargo.toLowerCase().includes(filtroCargo));

      document.getElementById('c-total').textContent = docs.length;

      if (docs.length === 0) {
        contenedor.innerHTML = `
          <div class="empty-state">
            <span class="icon">👥</span>
            <h3>No se encontraron miembros</h3>
            <p>Agrega el primer miembro del COCODE.</p>
          </div>`;
        return;
      }

      contenedor.innerHTML = '';
      docs.forEach(doc => {
        const d = doc.data();
        const card = document.createElement('div');
        card.className = 'record-card';
        card.innerHTML = `
          <div class="record-card-img">
            ${d.fotoUrl
              ? `<img src="${d.fotoUrl}" alt="${d.nombre}" loading="lazy">`
              : '<span>👤</span>'}
          </div>
          <div class="record-card-body">
            <h3>${escapeHtml(d.nombre)}</h3>
            <div class="record-meta">
              <span>🏛️ ${escapeHtml(d.cargo)}</span>
              <span>📍 ${escapeHtml(d.localidad)}</span>
              ${d.telefono ? `<span>📞 ${escapeHtml(d.telefono)}</span>` : ''}
              ${d.dpi ? `<span>🪪 ${escapeHtml(d.dpi)}</span>` : ''}
            </div>
            <div class="record-actions">
              <button class="btn btn-success" onclick="Cocode.descargarPDF('${doc.id}')">📥 PDF</button>
              <button class="btn btn-secondary" onclick="Cocode.editar('${doc.id}')">✏️ Editar</button>
              <button class="btn btn-danger" onclick="Cocode.eliminar('${doc.id}')">🗑️</button>
            </div>
          </div>`;
        contenedor.appendChild(card);
      });

    } catch (err) {
      console.error(err);
      contenedor.innerHTML = '<div class="empty-state"><h3>Error al cargar</h3></div>';
    }
  }

  // ---- EDITAR ----
  async function editar(id) {
    try {
      const doc = await db.collection('cocode').doc(id).get();
      if (!doc.exists) return;
      const d = doc.data();

      document.getElementById('c-nombre').value = d.nombre || '';
      document.getElementById('c-cargo').value = d.cargo || '';
      document.getElementById('c-localidad').value = d.localidad || '';
      document.getElementById('c-telefono').value = d.telefono || '';
      document.getElementById('c-dpi').value = d.dpi || '';
      document.getElementById('c-correo').value = d.correo || '';
      document.getElementById('c-direccion').value = d.direccion || '';
      document.getElementById('c-notas').value = d.notas || '';

      if (d.fotoUrl) {
        const preview = document.getElementById('c-preview');
        preview.src = d.fotoUrl;
        preview.style.display = 'block';
      }

      editandoId = id;
      document.getElementById('c-btn-guardar').innerHTML = '✏️ Actualizar Miembro';
      document.getElementById('c-form-section').scrollIntoView({ behavior: 'smooth' });

    } catch (err) { console.error(err); }
  }

  // ---- ELIMINAR ----
  async function eliminar(id) {
    if (!confirm('¿Eliminar este miembro del COCODE?')) return;
    try {
      const doc = await db.collection('cocode').doc(id).get();
      if (doc.data().fotoPath) {
        try { await storage.ref(doc.data().fotoPath).delete(); } catch(e) {}
      }
      await db.collection('cocode').doc(id).delete();
      cargarListado();
    } catch (err) { alert('Error: ' + err.message); }
  }

  // ---- DESCARGAR PDF INDIVIDUAL ----
  async function descargarPDF(id) {
    try {
      const doc = await db.collection('cocode').doc(id).get();
      if (!doc.exists) return;
      const d = doc.data();

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

      generarHeaderPDF(pdf, 'FICHA DE MIEMBRO COCODE');

      let y = 52;

      // Foto si existe
      if (d.fotoUrl) {
        try {
          const img = await cargarImagenBase64(d.fotoUrl);
          pdf.addImage(img, 'JPEG', 155, 44, 44, 44);
        } catch(e) {}
      }

      pdf.setTextColor(30, 58, 107);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DATOS DEL MIEMBRO', 14, y);
      pdf.setDrawColor(200, 220, 255);
      pdf.line(14, y + 2, 148, y + 2);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(30, 41, 59);
      y += 10;

      const campos = [
        ['Nombre completo:', d.nombre],
        ['Cargo:', d.cargo],
        ['Localidad:', d.localidad],
        ['Teléfono:', d.telefono || '—'],
        ['DPI:', d.dpi || '—'],
        ['Correo:', d.correo || '—'],
        ['Dirección:', d.direccion || '—'],
      ];

      campos.forEach(([label, valor]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 14, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(String(valor || '—'), 55, y);
        y += 8;
      });

      if (d.notas) {
        y += 4;
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 107);
        pdf.text('NOTAS:', 14, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 41, 59);
        const lines = pdf.splitTextToSize(d.notas, 182);
        pdf.text(lines, 14, y);
      }

      generarPiePDF(pdf);
      pdf.save(`COCODE_${d.nombre.replace(/\s+/g,'_')}.pdf`);

    } catch(err) {
      console.error(err);
      alert('Error al generar PDF: ' + err.message);
    }
  }

  // ---- DESCARGAR PDF POR LOCALIDAD ----
  async function descargarPDFLocalidad() {
    const localidad = document.getElementById('c-filtro-localidad').value.trim();

    try {
      let query = db.collection('cocode').orderBy('cargo');
      if (localidad) query = db.collection('cocode').where('localidad', '==', localidad).orderBy('cargo');
      const snapshot = await query.get();

      if (snapshot.empty) {
        alert('No hay registros para esta localidad.');
        return;
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

      const titulo = localidad ? `MIEMBROS COCODE — ${localidad.toUpperCase()}` : 'TODOS LOS MIEMBROS COCODE';
      generarHeaderPDF(pdf, titulo);

      // Tabla
      let y = 52;
      pdf.setFillColor(219, 234, 254);
      pdf.rect(14, y - 5, 188, 9, 'F');
      pdf.setTextColor(26, 58, 107);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NOMBRE', 16, y);
      pdf.text('CARGO', 75, y);
      pdf.text('LOCALIDAD', 125, y);
      pdf.text('TELÉFONO', 168, y);
      y += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(8.5);

      let i = 0;
      for (const doc of snapshot.docs) {
        const d = doc.data();

        if (y > 258) {
          pdf.addPage();
          generarHeaderPDF(pdf, titulo);
          y = 52;
        }

        if (i % 2 === 0) {
          pdf.setFillColor(241, 245, 249);
          pdf.rect(14, y - 4, 188, 8, 'F');
        }

        pdf.text((d.nombre || '—').substring(0, 28), 16, y);
        pdf.text((d.cargo || '—').substring(0, 22), 75, y);
        pdf.text((d.localidad || '—').substring(0, 18), 125, y);
        pdf.text((d.telefono || '—'), 168, y);
        y += 8;
        i++;
      }

      y += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 58, 107);
      pdf.text(`Total de miembros: ${snapshot.docs.length}`, 14, y);

      generarPiePDF(pdf);
      pdf.save(`COCODE_${localidad || 'todos'}_${new Date().toISOString().slice(0,10)}.pdf`);

    } catch(err) {
      console.error(err);
      alert('Error al generar PDF: ' + err.message);
    }
  }

  // ---- PDF HELPERS ----
  function generarHeaderPDF(pdf, titulo) {
    pdf.setFillColor(26, 58, 107);
    pdf.rect(0, 0, 216, 40, 'F');

    const logoImg = document.getElementById('header-logo-img');
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      try { pdf.addImage(logoImg, 'PNG', 8, 6, 26, 26); } catch(e) {}
    }

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text(titulo, 40, 18);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, 40, 26);
  }

  function generarPiePDF(pdf) {
    const total = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      pdf.setFillColor(26, 58, 107);
      pdf.rect(0, 272, 216, 16, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text('Sistema de Registro COCODE', 14, 280);
      pdf.text(`Página ${i} de ${total}`, 190, 280);
    }
  }

  // ---- UTILIDADES ----
  function limpiarFormulario() {
    ['c-nombre','c-cargo','c-localidad','c-telefono','c-dpi','c-correo','c-direccion','c-notas'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('c-foto').value = '';
    document.getElementById('c-preview').style.display = 'none';
    editandoId = null;
    document.getElementById('c-btn-guardar').innerHTML = '💾 Guardar Miembro';
  }

  async function cargarImagenBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function initPreview() {
    document.getElementById('c-foto').addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          const p = document.getElementById('c-preview');
          p.src = e.target.result;
          p.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('c-buscar').addEventListener('input', cargarListado);
    document.getElementById('c-filtro-localidad').addEventListener('input', cargarListado);
    document.getElementById('c-filtro-cargo').addEventListener('input', cargarListado);
  }

  return { guardar, cargarListado, editar, eliminar, descargarPDF, descargarPDFLocalidad, initPreview, limpiarFormulario };
})();
