import { useState } from "react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";

const IS = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12, padding: "12px 16px", color: "#fff",
  fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box",
  marginBottom: 12,
};

export default function AuthScreen({ lang }) {
  const [mode, setMode] = useState("login"); // login | register | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const LABELS = {
    fr: { login: "Connexion", register: "Créer un compte", reset: "Mot de passe oublié",
      email: "Email", password: "Mot de passe", submit: "Continuer",
      google: "Continuer avec Google", noAccount: "Pas de compte ?", hasAccount: "Déjà un compte ?",
      forgot: "Mot de passe oublié ?", resetBtn: "Envoyer le lien", resetSuccess: "Email envoyé ! Vérifie ta boîte.",
      back: "← Retour", tagline: "Partagez les dépenses facilement" },
    en: { login: "Sign in", register: "Create account", reset: "Forgot password",
      email: "Email", password: "Password", submit: "Continue",
      google: "Continue with Google", noAccount: "No account?", hasAccount: "Already have an account?",
      forgot: "Forgot password?", resetBtn: "Send reset link", resetSuccess: "Email sent! Check your inbox.",
      back: "← Back", tagline: "Split expenses effortlessly" },
    it: { login: "Accedi", register: "Crea account", reset: "Password dimenticata",
      email: "Email", password: "Password", submit: "Continua",
      google: "Continua con Google", noAccount: "Nessun account?", hasAccount: "Hai già un account?",
      forgot: "Password dimenticata?", resetBtn: "Invia link", resetSuccess: "Email inviata!",
      back: "← Indietro", tagline: "Dividi le spese facilmente" },
    es: { login: "Iniciar sesión", register: "Crear cuenta", reset: "Contraseña olvidada",
      email: "Email", password: "Contraseña", submit: "Continuar",
      google: "Continuar con Google", noAccount: "¿Sin cuenta?", hasAccount: "¿Ya tienes cuenta?",
      forgot: "¿Olvidaste tu contraseña?", resetBtn: "Enviar enlace", resetSuccess: "¡Email enviado!",
      back: "← Volver", tagline: "Comparte gastos fácilmente" },
    pt: { login: "Entrar", register: "Criar conta", reset: "Esqueci a senha",
      email: "Email", password: "Senha", submit: "Continuar",
      google: "Continuar com Google", noAccount: "Sem conta?", hasAccount: "Já tem conta?",
      forgot: "Esqueceu a senha?", resetBtn: "Enviar link", resetSuccess: "Email enviado!",
      back: "← Voltar", tagline: "Divida despesas facilmente" },
    ar: { login: "تسجيل الدخول", register: "إنشاء حساب", reset: "نسيت كلمة المرور",
      email: "البريد الإلكتروني", password: "كلمة المرور", submit: "متابعة",
      google: "المتابعة مع Google", noAccount: "ليس لديك حساب؟", hasAccount: "لديك حساب؟",
      forgot: "نسيت كلمة المرور؟", resetBtn: "إرسال الرابط", resetSuccess: "تم إرسال البريد!",
      back: "رجوع →", tagline: "تقاسم المصاريف بسهولة" },
    zh: { login: "登录", register: "创建账号", reset: "忘记密码",
      email: "邮箱", password: "密码", submit: "继续",
      google: "使用 Google 登录", noAccount: "没有账号？", hasAccount: "已有账号？",
      forgot: "忘记密码？", resetBtn: "发送链接", resetSuccess: "邮件已发送！",
      back: "← 返回", tagline: "轻松分摊费用" },
  };

  const l = LABELS[lang] || LABELS.fr;

  const parseError = (code) => {
    const map = {
      "auth/user-not-found": "Aucun compte avec cet email.",
      "auth/wrong-password": "Mot de passe incorrect.",
      "auth/email-already-in-use": "Cet email est déjà utilisé.",
      "auth/weak-password": "Mot de passe trop court (6 caractères min).",
      "auth/invalid-email": "Email invalide.",
      "auth/popup-closed-by-user": "Connexion Google annulée.",
      "auth/invalid-credential": "Email ou mot de passe incorrect.",
    };
    return map[code] || "Une erreur est survenue.";
  };

  const handleSubmit = async () => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, password);
      else if (mode === "register") await createUserWithEmailAndPassword(auth, email, password);
      else if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setSuccess(l.resetSuccess);
      }
    } catch (e) { setError(parseError(e.code)); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { setError(parseError(e.code)); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💸</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            SplitEasy <span style={{ color: "#4ECDC4" }}>✦</span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{l.tagline}</div>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 24px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 22 }}>
            {mode === "login" ? l.login : mode === "register" ? l.register : l.reset}
          </div>

          {/* Google button */}
          {mode !== "reset" && (
            <button onClick={handleGoogle} disabled={loading} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#fff", border: "none", borderRadius: 12, padding: "12px 0",
              cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 16,
              opacity: loading ? 0.7 : 1,
            }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              {l.google}
            </button>
          )}

          {mode !== "reset" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>ou</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>
          )}

          <input value={email} onChange={e => setEmail(e.target.value)} placeholder={l.email} type="email" style={IS} onKeyDown={e => e.key === "Enter" && handleSubmit()} />

          {mode !== "reset" && (
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder={l.password} type="password" style={IS} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          )}

          {error && <div style={{ color: "#FF6B6B", fontSize: 13, marginBottom: 10, padding: "8px 12px", background: "rgba(255,107,107,0.1)", borderRadius: 8 }}>{error}</div>}
          {success && <div style={{ color: "#4ECDC4", fontSize: 13, marginBottom: 10, padding: "8px 12px", background: "rgba(78,205,196,0.1)", borderRadius: 8 }}>{success}</div>}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", background: "linear-gradient(135deg,#4ECDC4,#2bb5ac)",
            border: "none", borderRadius: 12, padding: "13px 0",
            color: "#0f0f1a", fontWeight: 800, cursor: "pointer", fontSize: 15,
            opacity: loading ? 0.7 : 1, marginBottom: 16,
          }}>
            {loading ? "..." : mode === "reset" ? l.resetBtn : l.submit}
          </button>

          {/* Switch mode links */}
          <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {mode === "login" && <>
              <span>{l.noAccount} </span>
              <button onClick={() => { setMode("register"); setError(""); }} style={{ background: "none", border: "none", color: "#4ECDC4", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{l.register}</button>
              <br /><button onClick={() => { setMode("reset"); setError(""); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 12, marginTop: 6 }}>{l.forgot}</button>
            </>}
            {mode === "register" && <>
              <span>{l.hasAccount} </span>
              <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "#4ECDC4", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{l.login}</button>
            </>}
            {mode === "reset" && <>
              <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} style={{ background: "none", border: "none", color: "#4ECDC4", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{l.back}</button>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
