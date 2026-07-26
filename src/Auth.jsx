import React, { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
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
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Account aangemaakt. Check je mail om te bevestigen, log daarna in.");
      }
    } catch (err) {
      setError(err.message || "Er ging iets mis.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.page, maxWidth: 400, margin: "80px auto", backgroundImage: "none" }}>
        <div style={styles.pageLabel}>Groeiboekje</div>
        <h1 style={styles.h1}>{mode === "login" ? "Inloggen" : "Account maken"}</h1>
        <p style={styles.p}>
          {mode === "login"
            ? "Log in om je gezin en groeidata overal te kunnen bekijken."
            : "Maak een account om je gezinssituatie in te stellen."}
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <div>
            <label style={styles.blankLabel}>E-mail</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              style={styles.blankInput} placeholder="jij@voorbeeld.nl" autoComplete="email"
            />
          </div>
          <div>
            <label style={styles.blankLabel}>Wachtwoord</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              style={styles.blankInput} placeholder="••••••••" minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && <div style={{ ...styles.saveMsg, color: "#E4572E" }}>{error}</div>}
          {info && <div style={styles.saveMsg}>{info}</div>}

          <button className="gb-stampbtn" type="submit" disabled={busy} style={{ ...styles.stampBtn, justifyContent: "center", marginTop: 4 }}>
            {mode === "login" ? <LogIn size={14} /> : <UserPlus size={14} />}
            {busy ? "Bezig…" : mode === "login" ? "Inloggen" : "Account maken"}
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 13, color: "#6B7685" }}>
          {mode === "login" ? (
            <>Nog geen account?{" "}
              <button onClick={() => { setMode("signup"); setError(""); setInfo(""); }} style={styles.linkBtn}>Maak er een</button>
            </>
          ) : (
            <>Al een account?{" "}
              <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={styles.linkBtn}>Log in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
