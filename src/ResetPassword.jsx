import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";

export default function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Wachtwoord moet minstens 6 tekens zijn.");
      return;
    }
    if (password !== confirm) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onDone();
    } catch (err) {
      setError(err.message || "Bijwerken mislukt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.page, maxWidth: 400, margin: "80px auto", backgroundImage: "none" }}>
        <div style={styles.pageLabel}>Groeiboekje</div>
        <h1 style={styles.h1}>Nieuw wachtwoord</h1>
        <p style={styles.p}>Kies een nieuw wachtwoord voor je account.</p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <div>
            <label style={styles.blankLabel}>Nieuw wachtwoord</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              style={styles.blankInput} placeholder="••••••••" minLength={6} autoComplete="new-password"
            />
          </div>
          <div>
            <label style={styles.blankLabel}>Herhaal wachtwoord</label>
            <input
              type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              style={styles.blankInput} placeholder="••••••••" minLength={6} autoComplete="new-password"
            />
          </div>

          {error && <div style={{ ...styles.saveMsg, color: "#E4572E" }}>{error}</div>}

          <button className="gb-stampbtn" type="submit" disabled={busy} style={{ ...styles.stampBtn, justifyContent: "center", marginTop: 4 }}>
            <KeyRound size={14} /> {busy ? "Bezig…" : "Wachtwoord instellen"}
          </button>
        </form>
      </div>
    </div>
  );
}
