import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, Printer, Camera, MessageSquareText, Flag, Star } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";
import { STAGES, WEIGHT_REF_KG, LENGTH_REF_CM, buildChartData, MILESTONES } from "./content.js";

const NODE_COLORS = ["#0FB8A6", "#FF7A59", "#8B7FE0", "#F5A524"];

function weekFromBirthFor(birthDateStr, dateStr) {
  if (!birthDateStr || !dateStr) return null;
  const diffMs = new Date(dateStr) - new Date(birthDateStr);
  return Math.max(0, Math.min(52, Math.round(diffMs / (1000 * 60 * 60 * 24 * 7))));
}

export default function Jaarverslag({ child, siblings, partnerName, myName, onBack }) {
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [milestoneRows, setMilestoneRows] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [urls, setUrls] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [myUserId, setMyUserId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoaded(false);
      const { data: userData } = await supabase.auth.getUser();
      setMyUserId(userData.user?.id || null);
      const { data: g } = await supabase
        .from("growth_entries").select("week, weight, length").eq("child_id", child.id).order("week");
      const { data: p } = await supabase
        .from("photos").select("id, week, storage_path").eq("child_id", child.id).order("week");
      const { data: j } = await supabase
        .from("journal_entries").select("week, text, user_id").eq("child_id", child.id).order("week");
      const { data: m } = await supabase
        .from("milestones").select("milestone_key, achieved_date").eq("child_id", child.id);
      const { data: r } = await supabase
        .from("week_ratings").select("week, rating").eq("child_id", child.id);
      setEntries(g || []);
      setPhotos(p || []);
      setJournalEntries((j || []).filter(e => e.text?.trim()));
      setMilestoneRows(m || []);
      setRatings(r || []);
      const next = {};
      for (const photo of p || []) {
        const { data } = await supabase.storage.from("baby-photos").createSignedUrl(photo.storage_path, 3600);
        if (data?.signedUrl) next[photo.storage_path] = data.signedUrl;
      }
      setUrls(next);
      setLoaded(true);
    })();
  }, [child.id]);

  const weightData = useMemo(() => buildChartData(52, WEIGHT_REF_KG, entries, "weight"), [entries]);
  const lengthData = useMemo(() => buildChartData(52, LENGTH_REF_CM, entries, "length"), [entries]);

  const milestonesWithWeek = useMemo(() => {
    return milestoneRows.map(m => ({
      ...m,
      label: MILESTONES.find(x => x.key === m.milestone_key)?.label || m.milestone_key,
      week: weekFromBirthFor(child.birth_date, m.achieved_date),
    }));
  }, [milestoneRows, child.birth_date]);

  const stats = useMemo(() => {
    const weighed = entries.filter(e => e.weight != null).sort((a, b) => a.week - b.week);
    const lengthed = entries.filter(e => e.length != null).sort((a, b) => a.week - b.week);
    const weightGain = weighed.length >= 2 ? (weighed[weighed.length - 1].weight - weighed[0].weight) : null;
    const lengthGain = lengthed.length >= 2 ? (lengthed[lengthed.length - 1].length - lengthed[0].length) : null;
    const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) : null;
    return {
      photoCount: photos.length,
      noteCount: journalEntries.length,
      milestoneCount: milestonesWithWeek.length,
      weightGain, lengthGain, avgRating,
    };
  }, [entries, photos, journalEntries, milestonesWithWeek, ratings]);

  const timelineNodes = useMemo(() => {
    return STAGES.map((stage, i) => {
      const stagePhotos = photos.filter(p => p.week >= stage.start && p.week <= stage.end);
      const stageNotes = journalEntries.filter(j => j.week >= stage.start && j.week <= stage.end);
      const stageMilestones = milestonesWithWeek.filter(m => m.week != null && m.week >= stage.start && m.week <= stage.end);
      if (!stagePhotos.length && !stageNotes.length && !stageMilestones.length) return null;
      return { stage, stagePhotos, stageNotes, stageMilestones, color: NODE_COLORS[i % NODE_COLORS.length] };
    }).filter(Boolean);
  }, [photos, journalEntries, milestonesWithWeek]);

  if (!loaded) return <div style={{ padding: 40, fontFamily: "'Inter', sans-serif" }}>Jaarverslag samenstellen…</div>;

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

        <div style={{ ...styles.page, background: "linear-gradient(135deg, #0FB8A6 0%, #8B7FE0 100%)", border: "none", color: "#fff" }}>
          <div style={{ ...styles.pageLabel, color: "rgba(255,255,255,0.85)" }}>Jaarverslag</div>
          <h1 style={{ ...styles.h1, color: "#fff" }}>{child.name}'s eerste jaar</h1>
          <p style={{ ...styles.p, color: "rgba(255,255,255,0.9)" }}>
            {child.birth_date ? `Geboren op ${new Date(child.birth_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}.` : ""}
            {" "}Een reis door 52 weken groei, ontwikkeling en momenten.
          </p>
        </div>

        <div style={{ ...styles.page, marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          <StatBlock icon={Camera} color="#0FB8A6" value={stats.photoCount} label="foto's vastgelegd" />
          <StatBlock icon={MessageSquareText} color="#8B7FE0" value={stats.noteCount} label="verslagjes geschreven" />
          <StatBlock icon={Flag} color="#FF7A59" value={`${stats.milestoneCount} / ${MILESTONES.length}`} label="mijlpalen behaald" />
          <StatBlock
            icon={Star} color="#F5A524"
            value={stats.avgRating != null ? stats.avgRating.toFixed(1) : "—"}
            label="gemiddelde weekbeoordeling"
          />
          {(stats.weightGain != null || stats.lengthGain != null) && (
            <div style={{ gridColumn: "1 / -1", fontSize: 13, color: "#6B7685", textAlign: "center", paddingTop: 4 }}>
              {stats.weightGain != null && <>Gegroeid van eerste tot laatste meting: <b style={{ color: "#1E2530" }}>+{stats.weightGain.toFixed(1)} kg</b></>}
              {stats.weightGain != null && stats.lengthGain != null && "  ·  "}
              {stats.lengthGain != null && <>+{stats.lengthGain.toFixed(1)} cm</>}
            </div>
          )}
        </div>

        <div style={{ ...styles.page, marginTop: 14 }}>
          <div style={styles.sectionLabel}>Groei — gewicht (kg)</div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={weightData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E7EAF0" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#6B7685", fontFamily: "Inter" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7685", fontFamily: "Inter" }} width={28} domain={[0, 13]} ticks={[0, 3, 6, 9, 12]} />
              <Tooltip />
              <Line type="monotone" dataKey="gemeten" stroke="#0FB8A6" strokeWidth={2.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>

          <div style={{ ...styles.sectionLabel, marginTop: 14 }}>Groei — lengte (cm)</div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={lengthData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E7EAF0" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#6B7685", fontFamily: "Inter" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7685", fontFamily: "Inter" }} width={28} domain={[40, 82]} ticks={[40, 50, 60, 70, 80]} />
              <Tooltip />
              <Line type="monotone" dataKey="gemeten" stroke="#FF7A59" strokeWidth={2.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {timelineNodes.length > 0 && (
          <div style={{ ...styles.page, marginTop: 14 }}>
            <div style={styles.sectionLabel}>De tijdlijn</div>
            <div style={{ position: "relative", paddingLeft: 26, marginTop: 16 }}>
              <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 2, background: "#E7EAF0" }} />
              {timelineNodes.map((node, i) => (
                <div key={i} style={{ position: "relative", marginBottom: 28, breakInside: "avoid" }}>
                  <div style={{
                    position: "absolute", left: -26, top: 2, width: 16, height: 16, borderRadius: "50%",
                    background: node.color, border: "3px solid #FFFFFF", boxShadow: `0 0 0 2px ${node.color}`,
                  }} />
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 15, color: node.color, marginBottom: 8 }}>
                    {node.stage.label}
                  </div>

                  {node.stageMilestones.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      {node.stageMilestones.map((m, mi) => (
                        <span key={mi} style={{
                          display: "inline-flex", alignItems: "center", gap: 5, background: "#FFF4E0",
                          border: "1px solid #FBE1AE", color: "#9A6414", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 600,
                        }}>
                          <Flag size={11} /> {m.label}
                          <span style={{ fontWeight: 400, opacity: 0.8 }}>
                            · {new Date(m.achieved_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {node.stageNotes.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: node.stagePhotos.length ? 12 : 0 }}>
                      {node.stageNotes.map((n, ni) => (
                        <blockquote key={ni} style={{
                          margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15.5, fontStyle: "italic",
                          color: "#1E2530", borderLeft: `3px solid ${node.color}`, paddingLeft: 12, lineHeight: 1.4,
                        }}>
                          "{n.text}"
                          <div style={{ fontFamily: "'Inter', sans-serif", fontStyle: "normal", fontSize: 11.5, color: "#6B7685", marginTop: 4 }}>
                            — {n.user_id === myUserId ? (myName || "jij") : (partnerName || "partner")}, week {n.week}
                          </div>
                        </blockquote>
                      ))}
                    </div>
                  )}

                  {node.stagePhotos.length > 0 && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {node.stagePhotos.map((p) => (
                        urls[p.storage_path] && (
                          <img
                            key={p.id} src={urls[p.storage_path]} alt={node.stage.label}
                            style={{ width: 84, height: 84, objectFit: "cover", borderRadius: "50%", border: `3px solid ${node.color}` }}
                          />
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.footer}>Gemaakt met Groeiboekje · dossier POC, geen medisch advies</div>
      </div>
    </div>
  );
}

function StatBlock({ icon: Icon, color, value, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 4, padding: "8px 4px" }}>
      <Icon size={20} color={color} />
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 22, color: "#1E2530" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#6B7685" }}>{label}</div>
    </div>
  );
}
