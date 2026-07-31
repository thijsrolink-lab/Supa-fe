import React, { useState } from "react";
import { LogIn, UserPlus, KeyRound } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Account aangemaakt. Check je mail om te bevestigen, log daarna in.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setInfo("Check je mail — daar staat een link om een nieuw wachtwoord in te stellen.");
      }
    } catch (err) {
      setError(err.message || "Er ging iets mis.");
    } finally {
      setBusy(false);
    }
  };

  const titles = { login: "Inloggen", signup: "Account maken", forgot: "Wachtwoord vergeten" };
  const subtitles = {
    login: "Log in om je gezin en groeidata overal te kunnen bekijken.",
    signup: "Maak een account om je gezinssituatie in te stellen.",
    forgot: "Vul je e-mailadres in, dan sturen we een link om een nieuw wachtwoord in te stellen.",
  };

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.page, maxWidth: 400, margin: "80px auto", backgroundImage: "none" }}>
        <div style={styles.pageLabel}>Groeiboekje</div>
        <h1 style={styles.h1}>{titles[mode]}</h1>
        <p style={styles.p}>{subtitles[mode]}</p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <div>
            <label style={styles.blankLabel}>E-mail</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              style={styles.blankInput} placeholder="jij@voorbeeld.nl" autoComplete="email"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label style={styles.blankLabel}>Wachtwoord</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                style={styles.blankInput} placeholder="••••••••" minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          )}

          {error && <div style={{ ...styles.saveMsg, color: "#E4572E" }}>{error}</div>}
          {info && <div style={styles.saveMsg}>{info}</div>}

          <button className="gb-stampbtn" type="submit" disabled={busy} style={{ ...styles.stampBtn, justifyContent: "center", marginTop: 4 }}>
            {mode === "login" && <LogIn size={14} />}
            {mode === "signup" && <UserPlus size={14} />}
            {mode === "forgot" && <KeyRound size={14} />}
            {busy ? "Bezig…" : mode === "login" ? "Inloggen" : mode === "signup" ? "Account maken" : "Verstuur reset-link"}
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 13, color: "#6B7685", display: "flex", flexDirection: "column", gap: 6 }}>
          {mode === "login" && (
            <>
              <div>Nog geen account?{" "}
                <button onClick={() => { setMode("signup"); setError(""); setInfo(""); }} style={styles.linkBtn}>Maak er een</button>
              </div>
              <div>Wachtwoord vergeten?{" "}
                <button onClick={() => { setMode("forgot"); setError(""); setInfo(""); }} style={styles.linkBtn}>Reset 'm</button>
              </div>
            </>
          )}
          {mode === "signup" && (
            <div>Al een account?{" "}
              <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={styles.linkBtn}>Log in</button>
            </div>
          )}
          {mode === "forgot" && (
            <div>Weer terug?{" "}
              <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={styles.linkBtn}>Naar inloggen</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
