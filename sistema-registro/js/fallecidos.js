// ================================================
// MÓDULO: REGISTRO DE FALLECIDOS
// ================================================

const Fallecidos = (() => {

  let editandoId = null;

  // ---- GUARDAR NUEVO REGISTRO ----
  async function guardar() {
    const nombre = document.getElementById('f-nombre').value.trim();
    const fecha = document.getElementById('f-fecha').value;
    const localidad = document.getElementById('f-localidad').value.trim();
    const fileInput = document.getElementById('f-imagen');
    const msgEl = document.getElementById('f-msg');

    if (!nombre || !fecha || !localidad) {
      mostrarMsg(msgEl, '❌ Por favor llena todos los campos obligatorios.', 'error');
      return;
    }

    const btn = document.getElementById('f-btn-guardar');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Guardando...';

    try {
      let imageUrl = '';
      let imagePath = '';

      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const path = `fallecidos/${Date.now()}_${file.name}`;
        const ref = storage.ref(path);

        // Mostrar barra de progreso
        const progressBar = document.getElementById('f-progress');
        progressBar.classList.add('show');
        const fill = progressBar.querySelector('.progress-fill');

        const uploadTask = ref.put(file);

        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            snap => {
              const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
              fill.style.width = pct + '%';
            },
            reject,
            async () => {
              imageUrl = await uploadTask.snapshot.ref.getDownloadURL();
              imagePath = path;
              resolve();
            }
          );
        });

        progressBar.classList.remove('show');
        fill.style.width = '0%';
      }

      const datos = {
        nombre,
        fecha,
        localidad,
        notas: document.getElementById('f-notas').value.trim(),
        imageUrl,
        imagePath,
        creadoEn: firebase.firestore.FieldValue.serverTimestamp(),
        actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (editandoId) {
        await db.collection('fallecidos').doc(editandoId).update({
          ...datos,
          actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
        });
        mostrarMsg(msgEl, '✅ Registro actualizado correctamente.', 'success');
        editandoId = null;
        btn.textContent = '💾 Guardar Registro';
      } else {
        await db.collection('fallecidos').add(datos);
        mostrarMsg(msgEl, '✅ Registro guardado correctamente.', 'success');
      }

      limpiarFormulario();
      cargarListado();

    } catch (err) {
      console.error(err);
      mostrarMsg(msgEl, '❌ Error al guardar: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      if (!editandoId) btn.innerHTML = '💾 Guardar Registro';
    }
  }

  // ---- CARGAR LISTADO ----
  async function cargarListado() {
    const contenedor = document.getElementById('f-lista');
    const busqueda = document.getElementById('f-buscar').value.toLowerCase();
    const filtroLocalidad = document.getElementById('f-filtro-localidad').value.toLowerCase();

    contenedor.innerHTML = '<div class="empty-state"><span class="loader" style="width:32px;height:32px;border-color:#1a3a6b33;border-top-color:#1a3a6b"></span></div>';

    try {
      let query = db.collection('fallecidos').orderBy('creadoEn', 'desc');
      const snapshot = await query.get();

      let docs = snapshot.docs;

      // Filtros locales
      if (busqueda) {
        docs = docs.filter(d => d.data().nombre.toLowerCase().includes(busqueda));
      }
      if (filtroLocalidad) {
        docs = docs.filter(d => d.data().localidad.toLowerCase().includes(filtroLocalidad));
      }

      // Actualizar contador
      document.getElementById('f-total').textContent = docs.length;

      if (docs.length === 0) {
        contenedor.innerHTML = `
          <div class="empty-state">
            <span class="icon">📋</span>
            <h3>No se encontraron registros</h3>
            <p>Agrega el primer registro usando el formulario de arriba.</p>
          </div>`;
        return;
      }

      contenedor.innerHTML = '';
      docs.forEach(doc => {
        const d = doc.data();
        const fecha = d.fecha ? new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

        const card = document.createElement('div');
        card.className = 'record-card';
        card.innerHTML = `
          <div class="record-card-img">
            ${d.imageUrl
              ? `<img src="${d.imageUrl}" alt="Informe ${d.nombre}" loading="lazy">`
              : '<span>📄</span>'}
          </div>
          <div class="record-card-body">
            <h3>${escapeHtml(d.nombre)}</h3>
            <div class="record-meta">
              <span>📅 ${fecha}</span>
              <span>📍 ${escapeHtml(d.localidad)}</span>
              ${d.notas ? `<span>📝 ${escapeHtml(d.notas.substring(0,60))}${d.notas.length > 60 ? '...' : ''}</span>` : ''}
            </div>
            <div class="record-actions">
              ${d.imageUrl ? `<button class="btn btn-success" onclick="Fallecidos.descargarPDF('${doc.id}')">📥 PDF</button>` : ''}
              <button class="btn btn-secondary" onclick="Fallecidos.editar('${doc.id}')">✏️ Editar</button>
              <button class="btn btn-danger" onclick="Fallecidos.eliminar('${doc.id}')">🗑️</button>
            </div>
          </div>`;
        contenedor.appendChild(card);
      });

    } catch (err) {
      console.error(err);
      contenedor.innerHTML = '<div class="empty-state"><h3>Error al cargar registros</h3></div>';
    }
  }

  // ---- EDITAR ----
  async function editar(id) {
    try {
      const doc = await db.collection('fallecidos').doc(id).get();
      if (!doc.exists) return;
      const d = doc.data();

      document.getElementById('f-nombre').value = d.nombre || '';
      document.getElementById('f-fecha').value = d.fecha || '';
      document.getElementById('f-localidad').value = d.localidad || '';
      document.getElementById('f-notas').value = d.notas || '';

      if (d.imageUrl) {
        document.getElementById('f-preview').src = d.imageUrl;
        document.getElementById('f-preview').style.display = 'block';
      }

      editandoId = id;
      document.getElementById('f-btn-guardar').innerHTML = '✏️ Actualizar Registro';

      // Scroll al formulario
      document.getElementById('f-form-section').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      console.error(err);
    }
  }

  // ---- ELIMINAR ----
  async function eliminar(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.')) return;

    try {
      const doc = await db.collection('fallecidos').doc(id).get();
      const d = doc.data();

      // Eliminar imagen de Storage
      if (d.imagePath) {
        try { await storage.ref(d.imagePath).delete(); } catch (e) {}
      }

      await db.collection('fallecidos').doc(id).delete();
      cargarListado();

    } catch (err) {
      console.error(err);
      alert('Error al eliminar: ' + err.message);
    }
  }

  // ---- DESCARGAR PDF ----
  async function descargarPDF(id) {
    try {
      const doc = await db.collection('fallecidos').doc(id).get();
      if (!doc.exists) return;
      const d = doc.data();

      const fecha = d.fecha ? new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

      // Crear PDF con jsPDF
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

      // Header azul
      pdf.setFillColor(26, 58, 107);
      pdf.rect(0, 0, 216, 40, 'F');

      // Logo (si existe)
      const logoImg = document.getElementById('header-logo-img');
      if (logoImg && logoImg.src && !logoImg.src.includes('placeholder')) {
        try {
          pdf.addImage(logoImg, 'PNG', 8, 6, 26, 26);
        } catch(e) {}
      }

      // Título en PDF
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REGISTRO DE FALLECIDO', 40, 18);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sistema de Registro Civil — COCODE', 40, 26);

      // Datos del registro
      pdf.setTextColor(30, 58, 107);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DATOS DEL REGISTRO', 14, 52);

      pdf.setDrawColor(200, 220, 255);
      pdf.line(14, 54, 202, 54);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(30, 41, 59);

      const campos = [
        ['Nombre:', d.nombre || '—'],
        ['Fecha:', fecha],
        ['Localidad:', d.localidad || '—'],
        ['Notas:', d.notas || '—'],
      ];

      let y = 62;
      campos.forEach(([label, valor]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 14, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(valor, 50, y);
        y += 8;
      });

      // Imagen del informe
      if (d.imageUrl) {
        try {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 58, 107);
          pdf.setFontSize(11);
          pdf.text('INFORME ADJUNTO', 14, y + 8);
          pdf.line(14, y + 10, 202, y + 10);

          const img = await cargarImagenBase64(d.imageUrl);
          const maxW = 180;
          const maxH = 140;
          let imgW = maxW, imgH = maxH;

          pdf.addImage(img, 'JPEG', 14, y + 14, imgW, imgH);
          y += imgH + 20;
        } catch(e) {
          console.warn('No se pudo insertar imagen:', e);
        }
      }

      // Pie de página
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(26, 58, 107);
        pdf.rect(0, 272, 216, 16, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text(`Generado el ${new Date().toLocaleDateString('es-GT')} — Sistema de Registro Civil`, 14, 280);
        pdf.text(`Pág. ${i} / ${totalPages}`, 190, 280);
      }

      pdf.save(`Fallecido_${d.nombre.replace(/\s+/g, '_')}_${d.fecha || 'sin_fecha'}.pdf`);

    } catch (err) {
      console.error(err);
      alert('Error al generar PDF: ' + err.message);
    }
  }

  // ---- UTILIDADES ----
  function limpiarFormulario() {
    document.getElementById('f-nombre').value = '';
    document.getElementById('f-fecha').value = '';
    document.getElementById('f-localidad').value = '';
    document.getElementById('f-notas').value = '';
    document.getElementById('f-imagen').value = '';
    document.getElementById('f-preview').style.display = 'none';
    editandoId = null;
    document.getElementById('f-btn-guardar').innerHTML = '💾 Guardar Registro';
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

  // Previsualización de imagen al seleccionar
  function initPreview() {
    document.getElementById('f-imagen').addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          const preview = document.getElementById('f-preview');
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('f-buscar').addEventListener('input', cargarListado);
    document.getElementById('f-filtro-localidad').addEventListener('input', cargarListado);
  }

  return { guardar, cargarListado, editar, eliminar, descargarPDF, initPreview, limpiarFormulario };
})();
