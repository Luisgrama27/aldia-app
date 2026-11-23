import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import { collection, doc, onSnapshot, getDoc, getDocs, setDoc, updateDoc, deleteDoc, deleteField, writeBatch, query, where } from "firebase/firestore";

// Un "hogar" agrupa a varias personas que comparten la misma lista de productos.
// Cada persona tiene su hogar personal (su id es su uid). Para unirse a otro hogar se usa un código de 8 caracteres.
// Datos:
//   hogares/{hogarId}        -> { duenoUid, nombre, miembros: {uid: nombre}, creado, codigo?, codigoVenceMs?, codigoUsado? }
//   invitaciones/{codigo}    -> { hogarId, duenoUid, expiraMs }
//   perfiles/{uid}.hogarActivo -> hogar que la persona está viendo (si falta, su hogar personal)

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I, O, 0 ni 1 para evitar confusiones
const DIAS_CODIGO = 7;

const generarCodigo = () => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
};

const claveMig = (uid) => `hogarMig_${uid}`;

export function useHogar(usuario, nombre) {
  const uid = usuario ? usuario.uid : null;
  const [activo, setActivo] = useState(null); // hogar que se está viendo
  const [hogar, setHogar] = useState(null);
  const [listo, setListo] = useState(false); // el hogar personal existe y se migraron productos antiguos
  const [fallo, setFallo] = useState(""); // último error al preparar o leer el hogar, para mostrarlo en pantalla
  const perfilExiste = useRef(false);
  const nombreRef = useRef(nombre);
  nombreRef.current = nombre || (usuario && usuario.email ? usuario.email.split("@")[0] : "Persona");

  // 1) Asegurar el hogar personal y migrar productos anteriores (sin hogarId)
  useEffect(() => {
    if (!uid) { setListo(false); setActivo(null); setHogar(null); return; }
    let vivo = true;
    (async () => {
      try {
        const ref = doc(db, "hogares", uid);
        const s = await getDoc(ref);
        if (!s.exists()) {
          await setDoc(ref, { duenoUid: uid, nombre: "Mi hogar", miembros: { [uid]: nombreRef.current.slice(0, 60) }, creado: new Date().toISOString() });
        }
        let hecho = false;
        try { hecho = localStorage.getItem(claveMig(uid)) === "1"; } catch { /* sin almacenamiento */ }
        if (!hecho) {
          const snap = await getDocs(query(collection(db, "productos"), where("uid", "==", uid)));
          const sin = snap.docs.filter((d) => !d.data().hogarId);
          for (let i = 0; i < sin.length; i += 400) {
            const lote = writeBatch(db);
            sin.slice(i, i + 400).forEach((d) => lote.update(d.ref, { hogarId: uid }));
            await lote.commit();
          }
          try { localStorage.setItem(claveMig(uid), "1"); } catch { /* sin almacenamiento */ }
        }
      } catch (e) {
        console.error(e);
        if (vivo) setFallo(`preparar: ${(e && (e.code || e.message)) || e}`);
      } finally {
        if (vivo) setListo(true);
      }
    })();
    return () => { vivo = false; };
  }, [uid]);

  // 2) Qué hogar está activo (guardado en el perfil, para verlo igual en todos los dispositivos)
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "perfiles", uid), (snap) => {
      perfilExiste.current = snap.exists();
      setActivo((snap.exists() && snap.data().hogarActivo) || uid);
    }, (e) => { console.error(e); setActivo(uid); });
    return () => unsub();
  }, [uid]);

  const guardarActivo = useCallback(async (id) => {
    const datos = perfilExiste.current ? { hogarActivo: id } : { foto: "", hogarActivo: id };
    await setDoc(doc(db, "perfiles", uid), datos, { merge: true });
  }, [uid]);

  // 3) Datos del hogar activo; si ya no se puede leer (te quitaron o lo borraron) se vuelve al personal
  useEffect(() => {
    if (!uid || !activo || !listo) return;
    const volver = () => { if (activo !== uid) guardarActivo(uid).catch(console.error); setActivo(uid); };
    const unsub = onSnapshot(doc(db, "hogares", activo), (snap) => {
      if (!snap.exists()) { setHogar(null); volver(); return; }
      setHogar({ id: snap.id, ...snap.data() });
    }, (e) => { console.error(e); setFallo(`leer: ${(e && (e.code || e.message)) || e}`); setHogar(null); volver(); });
    return () => unsub();
  }, [uid, activo, listo, guardarActivo]);

  // Mantener actualizado mi nombre dentro del hogar
  useEffect(() => {
    if (!uid || !hogar || !hogar.miembros || hogar.miembros[uid] === undefined) return;
    const mio = nombreRef.current.slice(0, 60);
    if (hogar.miembros[uid] !== mio) updateDoc(doc(db, "hogares", hogar.id), { [`miembros.${uid}`]: mio }).catch(() => {});
  }, [uid, hogar]);

  const esDueno = !!hogar && hogar.duenoUid === uid;
  const miembros = hogar && hogar.miembros ? Object.entries(hogar.miembros).map(([id, n]) => ({ uid: id, nombre: n, dueno: id === hogar.duenoUid })) : [];
  const compartido = miembros.length > 1;

  const crearCodigo = async () => {
    const codigo = generarCodigo();
    const vence = Date.now() + DIAS_CODIGO * 86400000;
    await setDoc(doc(db, "invitaciones", codigo), { hogarId: uid, duenoUid: uid, expiraMs: vence });
    const anterior = hogar && hogar.codigo;
    await updateDoc(doc(db, "hogares", uid), { codigo, codigoVenceMs: vence });
    if (anterior) deleteDoc(doc(db, "invitaciones", anterior)).catch(() => {});
    return codigo;
  };

  const anularCodigo = async () => {
    const anterior = hogar && hogar.codigo;
    await updateDoc(doc(db, "hogares", uid), { codigo: deleteField(), codigoVenceMs: deleteField() });
    if (anterior) deleteDoc(doc(db, "invitaciones", anterior)).catch(() => {});
  };

  // Devuelve null si todo salió bien o un texto con el motivo
  const unirse = async (texto) => {
    const codigo = String(texto || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (codigo.length !== 8) return "El código tiene 8 caracteres.";
    let inv;
    try { inv = await getDoc(doc(db, "invitaciones", codigo)); } catch { return "Código no válido o vencido."; }
    if (!inv.exists() || inv.data().expiraMs < Date.now()) return "Código no válido o vencido.";
    const destino = inv.data().hogarId;
    if (destino === uid) return "Ese código es de tu propio hogar.";
    try {
      await updateDoc(doc(db, "hogares", destino), { [`miembros.${uid}`]: nombreRef.current.slice(0, 60), codigoUsado: codigo });
      await guardarActivo(destino);
    } catch (e) {
      console.error(e);
      return "No se pudo unir al hogar. Revisa el código o pide uno nuevo.";
    }
    return null;
  };

  const salir = async () => {
    if (!hogar || activo === uid) return;
    await updateDoc(doc(db, "hogares", hogar.id), { [`miembros.${uid}`]: deleteField() });
    await guardarActivo(uid);
    setActivo(uid);
  };

  const quitar = async (otroUid) => {
    if (!esDueno || otroUid === uid) return;
    await updateDoc(doc(db, "hogares", uid), { [`miembros.${otroUid}`]: deleteField() });
  };

  const renombrar = async (nuevo) => {
    if (!esDueno) return;
    await updateDoc(doc(db, "hogares", uid), { nombre: String(nuevo).trim().slice(0, 40) || "Mi hogar" });
  };

  const nombreDe = (id) => {
    const m = miembros.find((x) => x.uid === id);
    return m ? m.nombre : "";
  };

  return { fallo, hogarId: activo, hogar, listo: listo && !!activo && (activo === uid || (!!hogar && hogar.id === activo)), esDueno, miembros, compartido, nombreDe, crearCodigo, anularCodigo, unirse, salir, quitar, renombrar };
}

const venceTexto = (ms) => new Date(ms).toLocaleDateString("es-CO", { day: "numeric", month: "short" });

export function HogarVista({ usuario, h }) {
  const [codigoIn, setCodigoIn] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [confirmaSalir, setConfirmaSalir] = useState(false);
  const [nombreHogar, setNombreHogar] = useState("");
  const [tarda, setTarda] = useState(false);
  useEffect(() => {
    if (h.hogar) { setTarda(false); return; }
    const t = setTimeout(() => setTarda(true), 6000);
    return () => clearTimeout(t);
  }, [h.hogar]);
  const propio = !h.hogar || h.hogar.id === usuario.uid;
  const vigente = h.hogar && h.hogar.codigo && h.hogar.codigoVenceMs > Date.now();

  useEffect(() => { if (h.hogar) setNombreHogar(h.hogar.nombre || ""); }, [h.hogar && h.hogar.nombre]);

  const ejecutar = async (fn, errorTxt) => {
    setMsg(""); setOcupado(true);
    try { return await fn(); } catch (e) { console.error(e); setMsg(errorTxt || "No se pudo completar. Revisa tu conexión e inténtalo de nuevo."); }
    finally { setOcupado(false); }
  };

  const mensaje = () => `Únete a mi hogar en Al Día con este código: ${h.hogar.codigo}. Abre la app, entra a Cuenta, Mi hogar y escribe el código (vale hasta el ${venceTexto(h.hogar.codigoVenceMs)}).`;
  const copiar = async () => {
    try { await navigator.clipboard.writeText(h.hogar.codigo); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* sin portapapeles */ }
  };
  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(mensaje())}`, "_blank", "noopener,noreferrer");

  if (!h.hogar) {
    return (
      <p className="ad-muted" style={{ lineHeight: 1.5 }}>
        {tarda
          ? "No se pudo cargar tu hogar. Revisa tu conexión; si sigue igual, las reglas de la base de datos aún no incluyen los hogares (hay que publicarlas en Firebase)."
          : "Cargando tu hogar…"}
        {tarda && h.fallo && <span style={{ display: "block", marginTop: 8, fontSize: ".75rem", wordBreak: "break-all" }}>Detalle técnico: {h.fallo}</span>}
      </p>
    );
  }

  return (
    <div>
      <p className="ad-muted" style={{ marginBottom: 14, lineHeight: 1.5 }}>
        {propio
          ? "Invita a tu familia o a quienes viven contigo: todos ven y actualizan la misma lista de productos."
          : "Estás viendo la lista de otro hogar. Tus productos personales se conservan y vuelven cuando salgas."}
      </p>

      {propio&&h.esDueno&&(
        <div className="ad-field" style={{ marginBottom: 14 }}>
          <span className="ad-field__label">Nombre del hogar</span>
          <input maxLength={40} value={nombreHogar} onChange={(e) => setNombreHogar(e.target.value)}
            onBlur={() => { if (nombreHogar.trim() !== (h.hogar.nombre || "")) ejecutar(() => h.renombrar(nombreHogar)); }} />
        </div>
      )}
      {!propio&&<h3 className="ad-section" style={{ margin: "0 0 8px" }}>{h.hogar.nombre}</h3>}

      <p className="ad-eyebrow">Miembros ({h.miembros.length})</p>
      <div className="ad-card ad-group" style={{ marginBottom: 14 }}>
        {h.miembros.map((m) => (
          <div key={m.uid} className="ad-sheet__row" style={{ cursor: "default" }}>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
              {m.nombre}{m.uid === usuario.uid ? " (tú)" : ""}
            </span>
            <span className="ad-muted" style={{ marginLeft: "auto", fontSize: ".8125rem" }}>{m.dueno ? "Dueño" : "Miembro"}</span>
            {h.esDueno && m.uid !== usuario.uid && (
              <button type="button" className="ad-link ad-link--danger" style={{ marginLeft: 12 }} disabled={ocupado}
                onClick={() => { if (window.confirm(`¿Quitar a ${m.nombre} del hogar?`)) ejecutar(() => h.quitar(m.uid)); }}>Quitar</button>
            )}
          </div>
        ))}
      </div>

      {h.esDueno && (
        <>
          <p className="ad-eyebrow">Invitar</p>
          {vigente ? (
            <>
              <div className="ad-card ad-pad" style={{ textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: ".18em" }}>{h.hogar.codigo}</div>
                <div className="ad-muted" style={{ fontSize: ".8125rem", marginTop: 4 }}>Vale hasta el {venceTexto(h.hogar.codigoVenceMs)}</div>
              </div>
              <div className="ad-actions">
                <button className="ad-btn" onClick={whatsapp}>Enviar por WhatsApp</button>
                <button className="ad-btn ad-btn--ghost" onClick={copiar}>{copiado ? "¡Copiado!" : "Copiar código"}</button>
              </div>
              <button className="ad-link" disabled={ocupado} onClick={() => ejecutar(h.anularCodigo)}>Desactivar este código</button>
            </>
          ) : (
            <button className="ad-btn" disabled={ocupado} onClick={() => ejecutar(h.crearCodigo)}>{ocupado ? "Creando…" : "Crear código de invitación"}</button>
          )}
        </>
      )}

      {propio && (
        <div style={{ marginTop: 22 }}>
          <p className="ad-eyebrow">Unirme a otro hogar</p>
          <div className="ad-field">
            <input value={codigoIn} onChange={(e) => setCodigoIn(e.target.value.toUpperCase())} maxLength={9} autoCapitalize="characters" autoComplete="off" placeholder="Código de 8 caracteres" aria-label="Código de invitación" />
          </div>
          <button className="ad-btn ad-btn--ghost" style={{ marginTop: 10 }} disabled={ocupado || codigoIn.trim().length < 8}
            onClick={async () => { const r = await ejecutar(() => h.unirse(codigoIn)); if (r) setMsg(r); else if (r === null) setCodigoIn(""); }}>
            {ocupado ? "Uniendo…" : "Unirme"}
          </button>
        </div>
      )}

      {!propio && (
        confirmaSalir ? (
          <div className="ad-actions" style={{ marginTop: 18 }}>
            <button className="ad-btn ad-btn--danger" disabled={ocupado} onClick={() => ejecutar(h.salir)}>Sí, salir del hogar</button>
            <button className="ad-btn ad-btn--ghost" onClick={() => setConfirmaSalir(false)}>Cancelar</button>
          </div>
        ) : (
          <button className="ad-btn ad-btn--danger" style={{ marginTop: 18 }} onClick={() => setConfirmaSalir(true)}>Salir de este hogar</button>
        )
      )}

      {msg && <div className="ad-note ad-note--danger" role="alert" style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  );
}