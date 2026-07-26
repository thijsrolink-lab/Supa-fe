import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Square, CheckSquare, Stamp, Ruler, Weight, Plus, ChevronLeft, ChevronRight, Users, Settings, LogOut, BookOpen, Utensils, Moon, CloudRain } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";
import { STAGES, WEIGHT_REF_KG, LENGTH_REF_CM, buildChartData, getSiblingTips, TOPICS, getTopicTips } from "./content.js";
import PhotoPanel from "./PhotoPanel.jsx";

const TOPIC_ICONS = { eten: Utensils, slapen: Moon, huilen: CloudRain };

function weekFromBirth(birthDateStr) {
  if (!birthDateStr) return 0;
  const diffMs = new Date() - new Date(birthDateStr);
  return Math.max(0, Math.min(52, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7))));
}
function daysUntilBirth(birthDateStr) {
  if (!birthDateStr) return null;
  const diffMs = new Date(birthDateStr) - new Date();
  if (diffMs <= 0) return null;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
function renderText(str, vars) {
  return str
    .replace(/\{kind\}/g, vars.kind)
    .replace(/\{sibling\}/g, vars.sibling || "")
    .replace(/\{partner\}/g, vars.partner || "je partner");
}

// Toont alleen een stip op weken waar echt een meting is opgeslagen; de
// tussenliggende geïnterpoleerde punten blijven een vloeiende lijn zonder stippen.
function MeetpuntDot({ cx, cy, payload, color }) {
  if (!payload?.isMeetpunt || cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#FBF9F1" strokeWidth={1.5} />;
}

export default function Tracker({ child, siblings, partnerName, childOptions, onSelectChild, onEditFamily, onLogout, userId, onOpenReport }) {
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [viewWeek, setViewWeek] = useState(0);
  const [weightInput, setWeightInput] = useState("");
  const [lengthInput, setLengthInput] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [activeTopic, setActiveTopic] = useState(null);

  const currentWeek = weekFromBirth(child.birth_date);
  const countdown = daysUntilBirth(child.birth_date);

  useEffect(() => {
    setViewWeek(weekFromBirth(child.birth_date));
    (async () => {
      setLoaded(false);
      const { data, error } = await supabase
        .from("growth_entries")
        .select("week, weight, length")
        .eq("child_id", child.id)
        .order("week", { ascending: true });
      if (!error && data) setEntries(data);
      const { data: photoRows } = await supabase
        .from("photos")
        .select("id, week, storage_path, caption")
        .eq("child_id", child.id)
        .order("week", { ascending: true });
      setPhotos(photoRows || []);
      setLoaded(true);
    })();
  }, [child.id, child.birth_date]);

  const stage = useMemo(() => STAGES.find(s => viewWeek >= s.start && viewWeek <= s.end) || STAGES[0], [viewWeek]);
  const siblingNames = (siblings || []).map(s => s.name).join(" en ");
  const vars = { kind: child.name, sibling: siblingNames, partner: partnerName };

  const addEntry = async () => {
    if (!weightInput && !lengthInput) return;
    const existing = entries.find(e => e.week === viewWeek);
    const row = {
      child_id: child.id,
      week: viewWeek,
      // Als je maar één veld invult, blijft de eerder opgeslagen andere waarde staan.
      weight: weightInput ? parseFloat(weightInput) : (existing?.weight ?? null),
      length: lengthInput ? parseFloat(lengthInput) : (existing?.length ?? null),
    };
    const { error } = await supabase
      .from("growth_entries")
      .upsert(row, { onConflict: "child_id,week" });
    if (error) {
      setSaveMsg("Opslaan mislukt.");
    } else {
      setEntries(prev => [...prev.filter(e => e.week !== viewWeek), row].sort((a, b) => a.week - b.week));
      setWeightInput("");
      setLengthInput("");
      setSaveMsg(`Genoteerd bij week ${viewWeek}.`);
    }
    setTimeout(() => setSaveMsg(""), 2500);
  };


  const weightData = useMemo(() => buildChartData(52, WEIGHT_REF_KG, entries, "weight"), [entries]);
  const lengthData = useMemo(() => buildChartData(52, LENGTH_REF_CM, entries, "length"), [entries]);
  const months = useMemo(() => Array.from(new Set(STAGES.map(s => s.month))), []);

  if (!loaded) return <div style={{ padding: 40, fontFamily: "'IBM Plex Mono', monospace", color: "#1E2A33" }}>Even laden…</div>;

  return (
    <div style={styles.wrap}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          {childOptions && childOptions.length > 1 ? (
            <div style={styles.childTabs}>
              {childOptions.map((c) => (
                <button
                  key={c.id}
                  style={{ ...styles.childTab, ...(c.id === child.id ? styles.childTabActive : {}) }}
                  onClick={() => onSelectChild(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : <div />}
          <div style={{ display: "flex", gap: 6 }}>
            <button className="gb-navbtn" style={styles.iconBtn} onClick={onOpenReport} aria-label="Jaarverslag"><BookOpen size={15} /></button>
            <button className="gb-navbtn" style={styles.iconBtn} onClick={onEditFamily} aria-label="Gezin bewerken"><Settings size={15} /></button>
            <button className="gb-navbtn" style={styles.iconBtn} onClick={onLogout} aria-label="Uitloggen"><LogOut size={15} /></button>
          </div>
        </div>

        <div style={styles.quickTipsBox}>
          <div style={styles.quickTipsRow}>
            {TOPICS.map((t) => {
              const Icon = TOPIC_ICONS[t.id];
              const active = activeTopic === t.id;
              return (
                <button
                  key={t.id}
                  className="gb-navbtn"
                  style={{ ...styles.topicChip, ...(active ? styles.topicChipActive : {}) }}
                  onClick={() => setActiveTopic(active ? null : t.id)}
                >
                  <Icon size={13} /> {t.label}
                </button>
              );
            })}
          </div>
          {activeTopic && (
            <ul style={{ ...styles.checklist, marginTop: 10 }}>
              {getTopicTips(activeTopic, viewWeek).map((tip, i) => (
                <li key={i} style={styles.checkItem}>
                  {React.createElement(TOPIC_ICONS[activeTopic], { size: 13, color: "#8A5A2B", style: { flexShrink: 0, marginTop: 3 } })}
                  <span>{renderText(tip, vars)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={styles.tabStrip} className="gb-tabstrip">
          {months.map((m) => {
            const active = stage.month === m;
            return (
              <button
                key={m}
                className={`gb-tab${active ? " gb-tab-active" : ""}`}
                style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
                onClick={() => { const s = STAGES.find(s2 => s2.month === m); setViewWeek(s.start); }}
              >
                M{m}
              </button>
            );
          })}
        </div>

        <div style={styles.page}>
          <div style={styles.pageTopRow}>
            <div>
              <div style={styles.pageLabel}>Groeiboekje — {child.name}</div>
              <h1 style={styles.h1}>{stage.label}</h1>
            </div>
            <div className="gb-mono" style={{ ...styles.stamp, ...(countdown ? styles.stampCountdown : {}) }}>
              <Stamp size={16} style={{ marginBottom: 2 }} />
              {countdown ? (
                <>
                  <span>NOG</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{countdown}</span>
                  <span>{countdown === 1 ? "DAG" : "DAGEN"}</span>
                </>
              ) : `WEEK ${currentWeek}`}
            </div>
          </div>

          <div style={styles.navRow}>
            <button className="gb-navbtn" style={styles.navBtn} onClick={() => setViewWeek(Math.max(0, viewWeek - 1))} aria-label="Vorige week"><ChevronLeft size={16} /></button>
            <span className="gb-mono" style={styles.navWeek}>bekijkt week {viewWeek}</span>
            <button className="gb-navbtn" style={styles.navBtn} onClick={() => setViewWeek(Math.min(52, viewWeek + 1))} aria-label="Volgende week"><ChevronRight size={16} /></button>
          </div>

          <div style={styles.rule} />

          <div key={viewWeek} className="gb-fade">
            <div style={styles.sectionLabel}>Ontwikkeling</div>
            <ul style={styles.checklist}>
              {stage.facts.map((f, i) => (
                <li key={i} style={styles.checkItem}>
                  <CheckSquare size={15} color="#2F6F62" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{renderText(f, vars)}</span>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: 12 }}>
              <PhotoPanel childId={child.id} userId={userId} week={viewWeek} photos={photos} onChanged={setPhotos} />
            </div>

            <div style={styles.rule} />

            <div style={styles.noteBox}>
              <div style={styles.noteLabel}>Aantekening voor de ouders</div>
              <ul style={styles.checklist}>
                {stage.tips.map((t, i) => (
                  <li key={i} style={styles.checkItem}>
                    <Square size={13} color="#B0483D" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>{renderText(t, vars)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {siblings && siblings.length > 0 && (
              <>
                <div style={styles.rule} />
                {siblings.map((sib, si) => {
                  const tips = getSiblingTips(viewWeek, sib.birth_date);
                  const sibVars = { kind: child.name, sibling: sib.name, partner: partnerName };
                  return (
                    <div key={si} style={{ ...styles.siblingBox, marginBottom: si < siblings.length - 1 ? 10 : 0 }}>
                      <div style={styles.siblingLabel}><Users size={13} /> Omgang met {sib.name}</div>
                      <ul style={styles.checklist}>
                        {tips.map((t, i) => (
                          <li key={i} style={styles.checkItem}>
                            <Square size={13} color="#3F6E8C" style={{ flexShrink: 0, marginTop: 3 }} />
                            <span>{renderText(t, sibVars)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div style={styles.rule} />

          <div style={styles.sectionLabel}>Meting toevoegen — week {viewWeek}</div>
          <div style={styles.formRow}>
            <div className="gb-formfield" style={styles.formField}>
              <Weight size={14} color="#5B6670" />
              <span style={styles.formFieldLabel}>Gewicht</span>
              <input className="gb-forminput" type="number" inputMode="decimal" step="0.01" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} style={styles.formInput} placeholder="_____" />
              <span style={styles.formUnit}>kg</span>
            </div>
            <div className="gb-formfield" style={styles.formField}>
              <Ruler size={14} color="#5B6670" />
              <span style={styles.formFieldLabel}>Lengte</span>
              <input className="gb-forminput" type="number" inputMode="decimal" step="0.1" value={lengthInput} onChange={(e) => setLengthInput(e.target.value)} style={styles.formInput} placeholder="_____" />
              <span style={styles.formUnit}>cm</span>
            </div>
          </div>
          <button className="gb-stampbtn" style={styles.stampBtn} onClick={addEntry}><Plus size={14} /> Noteren</button>
          {saveMsg && <div style={styles.saveMsg}>{saveMsg}</div>}

          <div style={styles.chartsCol}>
            <div style={styles.chartBox}>
              <div style={styles.chartTitle}>GEWICHT (KG) — met WHO-referentie</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weightData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#DED9C4" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#5B6670", fontFamily: "IBM Plex Mono" }} label={{ value: "week", position: "insideBottom", offset: -2, fontSize: 10, fill: "#8A8368" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#5B6670", fontFamily: "IBM Plex Mono" }} width={30} domain={[0, 13]} ticks={[0, 3, 6, 9, 12]} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11 }} />
                  <Line type="monotone" dataKey="boven" name="bovengrens" stroke="#D9D4C0" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="gemiddeld" name="gemiddelde" stroke="#8A8368" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="onder" name="ondergrens" stroke="#6B6550" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="gemeten" name={child.name} stroke="#2F6F62" strokeWidth={3} dot={<MeetpuntDot color="#2F6F62" />} activeDot={{ r: 5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.chartBox}>
              <div style={styles.chartTitle}>LENGTE (CM) — met WHO-referentie</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={lengthData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#DED9C4" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#5B6670", fontFamily: "IBM Plex Mono" }} label={{ value: "week", position: "insideBottom", offset: -2, fontSize: 10, fill: "#8A8368" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#5B6670", fontFamily: "IBM Plex Mono" }} width={30} domain={[40, 82]} ticks={[40, 50, 60, 70, 80]} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11 }} />
                  <Line type="monotone" dataKey="boven" name="bovengrens" stroke="#D9D4C0" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="gemiddeld" name="gemiddelde" stroke="#8A8368" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="onder" name="ondergrens" stroke="#6B6550" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="gemeten" name={child.name} stroke="#B0483D" strokeWidth={3} dot={<MeetpuntDot color="#B0483D" />} activeDot={{ r: 5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={styles.chartFootnote}>
            Referentielijnen zijn benaderde WHO-groeiwaarden (meisjes), handmatig ingeschat — geen exacte klinische norm.
          </div>

          <div style={styles.footer}>
            {child.birth_date ? `Geboren ${new Date(child.birth_date).toLocaleDateString("nl-NL")}` : "Nog niet geboren"} · dossier POC, geen medisch advies
          </div>
        </div>
      </div>
    </div>
  );
}
