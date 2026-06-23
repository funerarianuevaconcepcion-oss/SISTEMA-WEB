# 📋 Sistema de Registro Civil — COCODE

Sistema web para administrar registros de fallecidos y datos de miembros del COCODE, con almacenamiento en Firebase.

---

## 🚀 Cómo configurar el sistema

### Paso 1: Crear proyecto en Firebase (GRATIS)

1. Ve a **https://console.firebase.google.com**
2. Haz clic en **"Crear un proyecto"**
3. Ponle un nombre (ej: `registro-cocode`)
4. Desactiva Google Analytics (opcional) → **Crear proyecto**

---

### Paso 2: Activar Firestore Database

1. En el menú izquierdo: **Compilación → Firestore Database**
2. Clic en **"Crear base de datos"**
3. Selecciona **"Iniciar en modo de prueba"** → Siguiente
4. Elige la ubicación: `us-central1` → **Listo**

---

### Paso 3: Activar Storage

1. En el menú izquierdo: **Compilación → Storage**
2. Clic en **"Comenzar"**
3. Selecciona modo de prueba → **Listo**

---

### Paso 4: Obtener credenciales

1. Haz clic en el ícono ⚙️ (Configuración) → **Configuración del proyecto**
2. Baja hasta **"Tus apps"** → clic en el ícono **Web** (`</>`)
3. Ponle un nombre a la app (ej: `sistema-web`) → **Registrar app**
4. Copia el objeto `firebaseConfig` que aparece

---

### Paso 5: Pegar credenciales en el proyecto

Abre el archivo **`firebase-config.js`** y reemplaza los valores:

```javascript
const firebaseConfig = {
  apiKey: "PEGA_TU_API_KEY_AQUÍ",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
```

---

### Paso 6: Agregar el logo

Al abrir el sistema en el navegador, haz clic en el ícono ⚙️ del encabezado y selecciona tu imagen de logo.

---

### Paso 7: Abrir el sistema

- Abre el archivo `index.html` directamente en el navegador, **O**
- Sube todos los archivos a un hosting gratuito como **Firebase Hosting** o **Netlify**

---

## 📁 Estructura del proyecto

```
sistema-registro/
├── index.html           ← Página principal
├── firebase-config.js   ← ⚠️ TUS credenciales van aquí
├── css/
│   └── styles.css       ← Estilos (tema azul)
└── js/
    ├── app.js           ← Lógica principal y navegación
    ├── fallecidos.js    ← Módulo de fallecidos
    └── cocode.js        ← Módulo COCODE
```

---

## ✅ Funcionalidades incluidas

| Función | Fallecidos | COCODE |
|---------|-----------|--------|
| Agregar registro | ✅ | ✅ |
| Subir imagen/foto | ✅ | ✅ |
| Buscar por nombre | ✅ | ✅ |
| Filtrar por localidad | ✅ | ✅ |
| Editar registro | ✅ | ✅ |
| Eliminar registro | ✅ | ✅ |
| Descargar PDF individual | ✅ | ✅ |
| Descargar PDF por localidad | — | ✅ |

---

## 🌐 Hosting gratuito con Firebase (opcional)

Para que el sistema funcione los 7 días de la semana desde cualquier lugar:

1. Instala Node.js desde https://nodejs.org
2. Abre una terminal en la carpeta del proyecto
3. Ejecuta:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```
4. ¡Listo! Tu sistema estará en línea en una URL como `https://tu-proyecto.web.app`

---

## 📞 Soporte

Para preguntas sobre Firebase: https://firebase.google.com/docs
