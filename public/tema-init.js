/* Aplica el tema guardado antes de pintar, para que la pantalla de carga ya salga con él */
try {
  var t = localStorage.getItem('tema_app');
  if (t === 'claro' || t === 'oscuro') document.documentElement.dataset.tema = t;
} catch (e) { /* sin almacenamiento */ }