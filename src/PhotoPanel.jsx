import React, { useState, useEffect, useCallback } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";

// Toont foto's van deze specifieke week + laat een nieuwe foto uploaden.
// photos: alle foto-rijen van het kind (uit Tracker, zodat we niet per week apart
// hoeven te fetchen); onChanged geeft de bijgewerkte lijst terug aan de ouder.
export default function PhotoPanel({ childId, userId, week, photos, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [urls, setUrls] = useState({}); // storage_path -> signed url

  const weekPhotos = photos.filter(p => p.week === week);

  const loadUrls = useCallback(async () => {
    const missing = weekPhotos.filter(p => !urls[p.storage_path]);
    if (missing.length === 0) return;
    const next = { ...urls };
    for (const p of missing) {
      const { data } = await supabase.storage.from("baby-photos").createSignedUrl(p.storage_path, 3600);
      if (data?.signedUrl) next[p.storage_path] = data.signedUrl;
    }
    setUrls(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, week]);

  useEffect(() => { loadUrls(); }, [loadUrls]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Alleen afbeeldingen zijn toegestaan.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Bestand is groter dan 8MB.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${childId}/${Date.now()}-w${week}.${ext}`;
      const { error: upErr } = await supabase.storage.from("baby-photos").upload(path, file);
      if (upErr) throw upErr;
      const { data: row, error: rowErr } = await supabase
        .from("photos")
        .insert({ child_id: childId, week, storage_path: path })
        .select()
        .single();
      if (rowErr) throw rowErr;
      onChanged([...photos, row]);
    } catch (err) {
      setError(err.message || "Uploaden mislukt.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (photo) => {
    await supabase.storage.from("baby-photos").remove([photo.storage_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    onChanged(photos.filter(p => p.id !== photo.id));
  };

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: weekPhotos.length ? 10 : 0 }}>
        {weekPhotos.map((p) => (
          <div key={p.id} style={styles.photoThumbWrap}>
            {urls[p.storage_path] ? (
              <img src={urls[p.storage_path]} alt={`Week ${week}`} style={styles.photoThumb} />
            ) : (
              <div style={{ ...styles.photoThumb, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={14} className="gb-spin" color="#8A8368" />
              </div>
            )}
            <button style={styles.photoRemoveBtn} onClick={() => remove(p)} aria-label="Verwijder foto">
              <X size={11} />
            </button>
          </div>
        ))}
      </div>
      <label style={styles.photoUploadBtn}>
        <Camera size={13} /> {busy ? "Bezig…" : "Foto toevoegen bij deze week"}
        <input type="file" accept="image/*" onChange={upload} disabled={busy} style={{ display: "none" }} />
      </label>
      {error && <div style={{ ...styles.saveMsg, color: "#B0483D" }}>{error}</div>}
    </div>
  );
}
