import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";
import { STAGES, WEIGHT_REF_KG, LENGTH_REF_CM, buildChartData } from "./content.js";

function renderText(str, vars) {
  return str
    .replace(/\{kind\}/g, vars.kind)
    .replace(/\{sibling\}/g, vars.sibling || "")
    .replace(/\{partner\}/g, vars.partner || "je partner");
}

export default function Jaarverslag({ child, siblings, partnerName, onBack }) {
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [urls, setUrls] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      setLoaded(false);
      const { data: g } = await supabase
        .from("growth_entries").select("week, weight, length").eq("child_id", child.id).order("week");
      const { data: p } = await supabase
        .from("photos").select("id, week, storage_path").eq("child_id", child.id).order("week");
      setEntries(g || []);
      setPhotos(p || []);
      const next = {};
      for (const photo of p || []) {
        const { data } = await supabase.storage.from("baby-photos").createSignedUrl(photo.storage_path, 3600);
        if (data?.signedUrl) next[photo.storage_path] = data.signedUrl;
      }
      setUrls(next);
      setLoaded(true);
    })();
  }, [child.id]);

  const vars = { kind: child.name, sibling: (siblings || []).map(s => s.name).join(" en "), partner: partnerName };
  const weightData = useMemo(() => buildChartData(52, WEIGHT_REF_KG, entries, "weight"), [entries]);
  const lengthData = useMemo(() => buildChartData(52, LENGTH_REF_CM, entries, "length"), [entries]);

  if (!loaded) return <div style={{ padding: 40, fontFamily: "'IBM Plex Mono', monospace" }}>Jaarverslag samenstellen…</div>;

  return (
    <div style={styles.wrap}>
      <style>{`
        @media print {
          .gb-no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <div style={{ ...styles.container, maxWidth: 720 }}>
        <div className="gb-no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <button className="gb-navbtn" style={{ ...styles.iconBtn, width: "auto", padding: "0 14px", gap: 6, display: "flex" }} onClick={onBack}>
            <ArrowLeft size={15} /> Terug
          </button>
          <button className="gb-stampbtn" style={styles.stampBtn} onClick={() => window.print()}>
            <Printer size={14} /> Printen / opslaan als PDF
          </button>
        </div>

        <div style={styles.page}>
          <div style={styles.pageLabel}>Jaarverslag</div>
          <h1 style={styles.h1}>{child.name}'s eerste jaar</h1>
          <p style={styles.p}>
            {child.birth_date ? `Geboren op ${new Date(child.birth_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}.` : ""}
            {" "}Een overzicht van 52 weken groei, ontwikkeling en momenten.
          </p>

          <div style={styles.rule} />

          <div style={styles.sectionLabel}>Groei — gewicht (kg)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#DED9C4" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#5B6670", fontFamily: "IBM Plex Mono" }} />
              <YAxis tick={{ fontSize: 10, fill: "#5B6670", fontFamily: "IBM Plex Mono" }} width={28} domain={[0, 13]} ticks={[0, 3, 6, 9, 12]} />
              <Tooltip />
              <Line type="monotone" dataKey="gemeten" stroke="#2F6F62" strokeWidth={2.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>

          <div style={styles.sectionLabel}>Groei — lengte (cm)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lengthData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#DED9C4" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#5B6670", fontFamily: "IBM Plex Mono" }} />
              <YAxis tick={{ fontSize: 10, fill: "#5B6670", fontFamily: "IBM Plex Mono" }} width={28} domain={[40, 82]} ticks={[40, 50, 60, 70, 80]} />
              <Tooltip />
              <Line type="monotone" dataKey="gemeten" stroke="#B0483D" strokeWidth={2.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>

          <div style={styles.rule} />

          {STAGES.map((stage, i) => {
            const stagePhotos = photos.filter(p => p.week >= stage.start && p.week <= stage.end);
            return (
              <div key={i} style={{ marginBottom: 22, breakInside: "avoid" }}>
                <div style={styles.sectionLabel}>{stage.label}</div>
                <ul style={styles.checklist}>
                  {stage.facts.slice(0, 2).map((f, fi) => (
                    <li key={fi} style={styles.checkItem}>
                      <span style={{ color: "#2F6F62" }}>·</span>
                      <span>{renderText(f, vars)}</span>
                    </li>
                  ))}
                </ul>
                {stagePhotos.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {stagePhotos.map((p) => (
                      urls[p.storage_path] && (
                        <img key={p.id} src={urls[p.storage_path]} alt={stage.label} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: "1px solid #D3CEB9" }} />
                      )
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={styles.footer}>Gemaakt met Groeiboekje · dossier POC, geen medisch advies</div>
        </div>
      </div>
    </div>
  );
}
