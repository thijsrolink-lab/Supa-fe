import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";
import { MILESTONES } from "./content.js";

export default function MilestonesPanel({ childId }) {
  const [achieved, setAchieved] = useState({}); // key -> achieved_date
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      setLoaded(false);
      const { data } = await supabase
        .from("milestones")
        .select("milestone_key, achieved_date")
        .eq("child_id", childId);
      const map = {};
      (data || []).forEach(m => { map[m.milestone_key] = m.achieved_date; });
      setAchieved(map);
      setLoaded(true);
    })();
  }, [childId]);

  const toggle = async (key) => {
    if (achieved[key]) {
      // Uitvinken: mijlpaal verwijderen.
      await supabase.from("milestones").delete().eq("child_id", childId).eq("milestone_key", key);
      setAchieved(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("milestones")
        .upsert({ child_id: childId, milestone_key: key, achieved_date: today }, { onConflict: "child_id,milestone_key" });
      if (!error) {
        setAchieved(prev => ({ ...prev, [key]: today }));
      }
    }
  };

  if (!loaded) return null;

  const doneCount = Object.keys(achieved).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 11 }}>
        <div style={styles.sectionLabel}>Mijlpalen</div>
        <span style={{ fontSize: 12, color: "#6B7685", fontWeight: 600 }}>{doneCount} / {MILESTONES.length}</span>
      </div>
      <ul style={styles.checklist}>
        {MILESTONES.map((m) => {
          const done = !!achieved[m.key];
          return (
            <li key={m.key} style={styles.milestoneRow} onClick={() => toggle(m.key)}>
              <span style={{ ...styles.milestoneCheck, ...(done ? styles.milestoneCheckDone : {}) }}>
                {done && <Check size={13} color="#fff" />}
              </span>
              <span style={{ ...styles.milestoneLabel, ...(done ? styles.milestoneLabelDone : {}) }}>{m.label}</span>
              {done && (
                <span style={styles.milestoneDate}>
                  {new Date(achieved[m.key]).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
