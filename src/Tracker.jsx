import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Square, CheckSquare, Stamp, Ruler, Weight, Plus, ChevronLeft, ChevronRight, Users, Settings, LogOut, BookOpen, Utensils, Moon, CloudRain, CalendarDays, TrendingUp, Image } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";
import { STAGES, WEIGHT_REF_KG, LENGTH_REF_CM, buildChartData, getSiblingTips, TOPICS, getTopicTips } from "./content.js";
import PhotoPanel from "./PhotoPanel.jsx";
import JournalPanel from "./JournalPanel.jsx";

const TOPIC_ICONS = { eten: Utensils, slapen: Moon, huilen: CloudRain };

const TABS = [
  { id: "vandaag", label: "Vandaag", icon: CalendarDays, color: "#0FB8A6" },
  { id: "groei", label: "Groei", icon: TrendingUp, color: "#FF7A59" },
  { id: "media", label: "Foto's & verslag", icon: Image, color: "#8B7FE0" },
];

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
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#FFFFFF" strokeWidth={1.5} />;
}

export default function Tracker({ child, siblings, partnerName, childOptions, onSelectChild, onEditFamily, onLogout, userId, onOpenReport }) {
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [viewWeek, setViewWeek] = useState(0);
  const [weightInput, setWeightInput] = useState("");
  const [lengthInput, setLengthInput] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeTab, setActiveTab] = useState("vandaag");

  const currentWeek = weekFromBirth(child.birth_date);
  const countdown = daysUntilBirth(child.birth_date);

  useEffect(() => {
    setViewWeek(weekFromBirth(child.birth_date));
    setActiveTab("vandaag");
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
      const { data: journalRows } = await supabase
        .from("journal_entries")
        .select("week, text")
        .eq("child_id", child.id)
        .order("week", { ascending: true });
      setJournalEntries(journalRows || []);
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

  if (!loaded) return <div style={{ padding: 40, fontFamily: "'Inter', sans-serif", color: "#1E2A33" }}>Even laden…</div>;

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.container, paddingBottom: 96 }}>
        {/* Top bar: child switcher + icon actions */}
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

        {/* Persistent week header: stamp, prev/next, month tabs — geldt voor alle 3 blokken */}
        <div style={styles.weekHeaderCard}>
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

          <div style={styles.tabStrip} className="gb-tabstrip">
            {months.map((m) => {
              const active = stage.month === m;
              return (
                <button
                  key={m}
                  className={`gb-tab${active ? " gb-tab-active" : ""}`}
                  style={{ ...styles.tab, ...(active ? styles.tabActive : {}), borderRadius: 7 }}
                  onClick={() => { const s = STAGES.find(s2 => s2.month === m); setViewWeek(s.start); }}
                >
                  M{m}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Tab: Vandaag ---- */}
        {activeTab === "vandaag" && (
          <div key={viewWeek} className="gb-fade">
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
                      {React.createElement(TOPIC_ICONS[activeTopic], { size: 13, color: "#9A6414", style: { flexShrink: 0, marginTop: 3 } })}
                      <span>{renderText(tip, vars)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={styles.page}>
              <div style={styles.sectionLabel}>Ontwikkeling</div>
              <ul style={styles.checklist}>
                {stage.facts.map((f, i) => (
                  <li key={i} style={styles.checkItem}>
                    <CheckSquare size={15} color="#0FB8A6" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{renderText(f, vars)}</span>
                  </li>
                ))}
              </ul>

              <div style={styles.rule} />

              <div style={styles.noteBox}>
                <div style={styles.noteLabel}>Aantekening voor de ouders</div>
                <ul style={styles.checklist}>
                  {stage.tips.map((t, i) => (
                    <li key={i} style={styles.checkItem}>
                      <Square size={13} color="#FF7A59" style={{ flexShrink: 0, marginTop: 3 }} />
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
                              <Square size={13} color="#8B7FE0" style={{ flexShrink: 0, marginTop: 3 }} />
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
          </div>
        )}

        {/* ---- Tab: Groei ---- */}
        {activeTab === "groei" && (
          <div key={viewWeek} className="gb-fade">
            <div style={styles.page}>
              <div style={styles.sectionLabel}>Meting toevoegen — week {viewWeek}</div>
              <div style={styles.formRow}>
                <div className="gb-formfield" style={styles.formField}>
                  <Weight size={14} color="#6B7685" />
                  <span style={styles.formFieldLabel}>Gewicht</span>
                  <input className="gb-forminput" type="number" inputMode="decimal" step="0.01" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} style={styles.formInput} placeholder="_____" />
                  <span style={styles.formUnit}>kg</span>
                </div>
                <div className="gb-formfield" style={styles.formField}>
                  <Ruler size={14} color="#6B7685" />
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
                      <CartesianGrid strokeDasharray="2 4" stroke="#E7EAF0" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6B7685", fontFamily: "Inter" }} label={{ value: "week", position: "insideBottom", offset: -2, fontSize: 10, fill: "#9AA3AF" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#6B7685", fontFamily: "Inter" }} width={30} domain={[0, 13]} ticks={[0, 3, 6, 9, 12]} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontFamily: "Inter", fontSize: 11 }} />
                      <Line type="monotone" dataKey="boven" name="bovengrens" stroke="#D8DCE3" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                      <Line type="monotone" dataKey="gemiddeld" name="gemiddelde" stroke="#9AA3AF" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                      <Line type="monotone" dataKey="onder" name="ondergrens" stroke="#6B7280" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                      <Line type="monotone" dataKey="gemeten" name={child.name} stroke="#0FB8A6" strokeWidth={3} dot={<MeetpuntDot color="#0FB8A6" />} activeDot={{ r: 5 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={styles.chartBox}>
                  <div style={styles.chartTitle}>LENGTE (CM) — met WHO-referentie</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={lengthData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke="#E7EAF0" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6B7685", fontFamily: "Inter" }} label={{ value: "week", position: "insideBottom", offset: -2, fontSize: 10, fill: "#9AA3AF" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#6B7685", fontFamily: "Inter" }} width={30} domain={[40, 82]} ticks={[40, 50, 60, 70, 80]} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontFamily: "Inter", fontSize: 11 }} />
                      <Line type="monotone" dataKey="boven" name="bovengrens" stroke="#D8DCE3" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                      <Line type="monotone" dataKey="gemiddeld" name="gemiddelde" stroke="#9AA3AF" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                      <Line type="monotone" dataKey="onder" name="ondergrens" stroke="#6B7280" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                      <Line type="monotone" dataKey="gemeten" name={child.name} stroke="#FF7A59" strokeWidth={3} dot={<MeetpuntDot color="#FF7A59" />} activeDot={{ r: 5 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={styles.chartFootnote}>
                Referentielijnen zijn benaderde WHO-groeiwaarden (meisjes), handmatig ingeschat — geen exacte klinische norm.
              </div>
            </div>
          </div>
        )}

        {/* ---- Tab: Foto's & verslag ---- */}
        {activeTab === "media" && (
          <div key={viewWeek} className="gb-fade">
            <div style={styles.page}>
              <div style={styles.sectionLabel}>Foto's — week {viewWeek}</div>
              <PhotoPanel childId={child.id} userId={userId} week={viewWeek} photos={photos} onChanged={setPhotos} />

              <div style={styles.rule} />

              <div style={styles.sectionLabel}>Verslagje — week {viewWeek}</div>
              <JournalPanel childId={child.id} week={viewWeek} entries={journalEntries} onChanged={setJournalEntries} />
            </div>
          </div>
        )}

        <div style={styles.footer}>
          {child.birth_date ? `Geboren ${new Date(child.birth_date).toLocaleDateString("nl-NL")}` : "Nog niet geboren"} · dossier POC, geen medisch advies
        </div>
      </div>

      {/* Onderin-navigatie */}
      <div style={styles.bottomNav}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              style={{ ...styles.bottomNavBtn, ...(active ? { ...styles.bottomNavBtnActive, background: t.color } : {}) }}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={19} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
