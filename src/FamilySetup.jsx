import React, { useState } from "react";
import { Plus, X, Save, LogOut } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";

// existingFamily: null (first-time setup) or { id, father_name, mother_name, children: [{id,name,birth_date}] }
export default function FamilySetup({ existingFamily, onSaved, onLogout }) {
  const [father, setFather] = useState(existingFamily?.father_name || "");
  const [mother, setMother] = useState(existingFamily?.mother_name || "");
  const [children, setChildren] = useState(
    existingFamily?.children?.length
      ? existingFamily.children.map(c => ({ id: c.id, name: c.name, birth_date: c.birth_date || "" }))
      : [{ id: null, name: "", birth_date: "" }]
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const updateChild = (i, field, value) => {
    setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };
  const addChild = () => setChildren(prev => [...prev, { id: null, name: "", birth_date: "" }]);
  const removeChild = (i) => setChildren(prev => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const cleanChildren = children.map(c => ({ ...c, name: c.name.trim() })).filter(c => c.name);
    if (cleanChildren.length === 0) {
      setError("Vul minstens één kind in.");
      return;
    }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let familyId = existingFamily?.id;

      if (!familyId) {
        const { data, error } = await supabase
          .from("families")
          .insert({ user_id: user.id, father_name: father.trim(), mother_name: mother.trim() })
          .select()
          .single();
        if (error) throw error;
        familyId = data.id;
      } else {
        const { error } = await supabase
          .from("families")
          .update({ father_name: father.trim(), mother_name: mother.trim() })
          .eq("id", familyId);
        if (error) throw error;
      }

      // Upsert children: update existing, insert new, delete removed
      const existingIds = (existingFamily?.children || []).map(c => c.id);
      const keptIds = cleanChildren.filter(c => c.id).map(c => c.id);
      const removedIds = existingIds.filter(id => !keptIds.includes(id));

      if (removedIds.length) {
        await supabase.from("children").delete().in("id", removedIds);
      }
      for (const c of cleanChildren) {
        if (c.id) {
          await supabase.from("children").update({ name: c.name, birth_date: c.birth_date || null }).eq("id", c.id);
        } else {
          await supabase.from("children").insert({ family_id: familyId, name: c.name, birth_date: c.birth_date || null });
        }
      }

      onSaved();
    } catch (err) {
      setError(err.message || "Opslaan mislukt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.page, maxWidth: 480, margin: "40px auto", backgroundImage: "none" }}>
        <div style={styles.topBar}>
          <div>
            <div style={styles.pageLabel}>Groeiboekje</div>
            <h1 style={styles.h1}>{existingFamily ? "Gezin bewerken" : "Vertel over je gezin"}</h1>
          </div>
          <button className="gb-navbtn" style={styles.iconBtn} onClick={onLogout} aria-label="Uitloggen" type="button">
            <LogOut size={15} />
          </button>
        </div>
        <p style={styles.p}>
          {existingFamily
            ? "Pas namen en geboortedata aan, of voeg een kind toe."
            : "Dit gebruiken we om de weetjes en tips persoonlijk te maken."}
        </p>

        <form onSubmit={submit}>
          <div style={styles.formGroup}>
            <label style={styles.blankLabel}>Vader</label>
            <input value={father} onChange={(e) => setFather(e.target.value)} style={styles.blankInput} placeholder="Naam" />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.blankLabel}>Moeder</label>
            <input value={mother} onChange={(e) => setMother(e.target.value)} style={styles.blankInput} placeholder="Naam" />
          </div>

          <div style={styles.sectionLabel}>Kinderen</div>
          {children.map((c, i) => (
            <div key={i} style={styles.memberRow}>
              <input
                value={c.name} onChange={(e) => updateChild(i, "name", e.target.value)}
                style={styles.memberInput} placeholder="Naam"
              />
              <input
                type="date" value={c.birth_date} onChange={(e) => updateChild(i, "birth_date", e.target.value)}
                style={styles.memberDateInput}
              />
              {children.length > 1 && (
                <button type="button" style={styles.removeBtn} onClick={() => removeChild(i)} aria-label="Verwijder kind">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button type="button" style={styles.addRowBtn} onClick={addChild}>
            <Plus size={14} /> Nog een kind toevoegen
          </button>

          {error && <div style={{ ...styles.saveMsg, color: "#B0483D" }}>{error}</div>}

          <button className="gb-stampbtn" type="submit" disabled={busy} style={{ ...styles.stampBtn, justifyContent: "center", width: "100%" }}>
            <Save size={14} /> {busy ? "Opslaan…" : "Opslaan"}
          </button>
        </form>

        <div style={styles.chartFootnote}>
          Broers/zussen worden automatisch afgeleid: als je meerdere kinderen invult, zie je bij elk kind
          de anderen terug in de "omgang met broer/zus"-tips.
        </div>
      </div>
    </div>
  );
}
