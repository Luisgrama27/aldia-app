// Términos de uso y política de privacidad (se muestran en Cuenta y también antes de crear la cuenta)

export const SOPORTE_EMAIL = "soporte@aldia.com";
export const FECHA_LEGAL = "8 de octubre de 2026";

export default function LegalVista() {
  const h = { margin: '18px 0 6px' };
  const p = { color: 'var(--text2)', lineHeight: 1.55, fontSize: '0.9375rem', marginBottom: 8 };
  return (
    <div>
      <p className="ad-muted">Última actualización: {FECHA_LEGAL}</p>

      <h3 className="ad-section" style={h}>Términos de uso</h3>
      <p style={p}><strong>1. Qué es Al Día.</strong> Es una aplicación para registrar los productos de tu hogar y recibir avisos antes de que venzan.</p>
      <p style={p}><strong>2. Uso informativo.</strong> Los avisos se calculan con las fechas que tú registras. Al Día no reemplaza tu criterio: revisa siempre el estado del producto y la etiqueta del empaque antes de consumirlo, sobre todo alimentos y medicamentos. No nos hacemos responsables por decisiones tomadas únicamente con la información registrada.</p>
      <p style={p}><strong>3. Tu cuenta.</strong> Eres responsable de tu contraseña y de la información que registras.</p>
      <p style={p}><strong>4. Edad.</strong> Debes ser mayor de 18 años para crear una cuenta.</p>
      <p style={p}><strong>5. Uso adecuado.</strong> No uses la app con fines ilícitos ni intentes acceder a datos de otras personas.</p>
      <p style={p}><strong>6. Disponibilidad.</strong> La app se ofrece tal como está y puede tener interrupciones o cambios.</p>
      <p style={p}><strong>7. Cambios.</strong> Podemos actualizar estos términos y te avisaremos dentro de la app.</p>

      <h3 className="ad-section" style={h}>Política de privacidad</h3>
      <p style={p}><strong>Qué datos guardamos.</strong> Tu nombre, tu correo, la foto de perfil de Google si inicias sesión con Google, y los productos que registras (nombre, categoría, fecha de vencimiento, cantidad, precio y estado). Si creas tu cuenta con correo y contraseña, guardamos también tu país, tu ciudad, tu fecha de nacimiento, tu teléfono (si decides escribirlo), si quieres recibir consejos y la fecha en que aceptaste estos términos. Si usas la opción Compartir, guardamos además una copia de solo lectura de tu lista (nombre, categoría, fecha y cantidad de cada producto, y tu nombre) durante 7 días.</p>
      <p style={p}><strong>Para qué los usamos.</strong> Para mostrar tu lista, enviarte avisos y calcular tus estadísticas. Los datos de tu perfil sirven para administrar tu cuenta y, si lo aceptaste, para enviarte consejos para reducir el desperdicio.</p>
      <p style={p}><strong>Dónde se guardan.</strong> Usamos Firebase (Google) para el inicio de sesión y la base de datos, y EmailJS para enviar los correos de bienvenida y de aviso. Tu meta de desperdicio, tus preferencias y el tema se guardan solo en tu dispositivo.</p>
      <p style={p}><strong>Con quién los compartimos.</strong> No vendemos tus datos. Solo los compartimos con los proveedores anteriores, que son necesarios para que la app funcione. La lista que compartes con el botón Compartir queda como una copia de solo lectura que cualquier persona con el enlace puede ver durante 7 días; puedes desactivarla cuando quieras. Lo que envías por WhatsApp o correo lo decides tú.</p>
      <p style={p}><strong>Tus derechos.</strong> Puedes pedir conocer, actualizar, corregir o eliminar tus datos personales, según la Ley 1581 de 2012 de Colombia. Escríbenos a {SOPORTE_EMAIL}.</p>
      <p style={p}><strong>Seguridad.</strong> Cada cuenta solo puede acceder a sus propios productos. Las listas compartidas solo se abren con su enlace, que es único y difícil de adivinar.</p>
    </div>
  );
}