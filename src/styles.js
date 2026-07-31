// ---------- Frisse, moderne stijl — kleur- en typografiesysteem ----------
// Achtergrond: licht, koel neutraal. Kaarten: wit, zachte schaduw, ronde hoeken.
// Kleurcode per onderdeel: teal (Vandaag/primair), koraal (Groei/metingen),
// lavendel (Foto's & verslag), amber (snel advies).
const COLOR = {
  bg: "#F4F7F8",
  card: "#FFFFFF",
  border: "#E7EAF0",
  ink: "#1E2530",
  inkMuted: "#6B7685",
  teal: "#0FB8A6",
  tealSoft: "#E3F7F4",
  coral: "#FF7A59",
  coralSoft: "#FFEDE7",
  lavender: "#8B7FE0",
  lavenderSoft: "#F1EFFB",
  amber: "#F5A524",
  amberSoft: "#FFF4E0",
  amberText: "#9A6414",
};

const FONT_DISPLAY = "'Plus Jakarta Sans', sans-serif";
const FONT_BODY = "'Inter', sans-serif";

export const styles = {
  wrap: { minHeight: "100vh", background: COLOR.bg, fontFamily: FONT_BODY, color: COLOR.ink, WebkitFontSmoothing: "antialiased" },
  container: { maxWidth: 640, margin: "0 auto", padding: "22px 16px 64px" },

  // Month tab strip (inside week header card)
  tabStrip: { display: "flex", gap: 6, overflowX: "auto", marginTop: 12, paddingBottom: 2 },
  tab: { flexShrink: 0, border: "1px solid transparent", background: COLOR.bg, color: COLOR.inkMuted, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12, padding: "7px 12px", borderRadius: 10, cursor: "pointer" },
  tabActive: { background: COLOR.teal, color: "#fff", borderColor: COLOR.teal },

  page: {
    background: COLOR.card,
    border: `1px solid ${COLOR.border}`,
    borderRadius: 18,
    padding: "22px 20px 26px",
    boxShadow: "0 1px 2px rgba(30,42,51,0.03), 0 14px 28px -18px rgba(30,42,51,0.14)",
  },
  pageTopRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  pageLabel: { fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase", color: COLOR.inkMuted, fontWeight: 700 },
  h1: { fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, margin: "3px 0 0", color: COLOR.ink, letterSpacing: "-0.01em" },
  p: { fontSize: 14, color: COLOR.inkMuted, lineHeight: 1.55 },

  stamp: {
    background: `linear-gradient(135deg, ${COLOR.teal}, #0C9A8A)`, color: "#fff", borderRadius: "50%", width: 66, height: 66,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 700,
    letterSpacing: "0.02em", flexShrink: 0,
    boxShadow: "0 6px 16px -6px rgba(15,184,166,0.55)",
  },
  stampCountdown: { background: `linear-gradient(135deg, ${COLOR.coral}, #E85F3E)`, boxShadow: "0 6px 16px -6px rgba(255,122,89,0.55)" },

  navRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 14 },
  navBtn: { border: `1px solid ${COLOR.border}`, background: COLOR.bg, borderRadius: 10, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLOR.ink },
  navWeek: { fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: COLOR.inkMuted },

  rule: { borderTop: `1px solid ${COLOR.border}`, margin: "18px 0" },
  sectionLabel: { fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase", color: COLOR.inkMuted, marginBottom: 11, fontWeight: 700 },
  checklist: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  checkItem: { display: "flex", gap: 9, fontSize: 14.5, lineHeight: 1.5, color: COLOR.ink },

  noteBox: { background: COLOR.coralSoft, border: `1px solid #FFD4C6`, borderRadius: 14, padding: "15px 17px" },
  noteLabel: { fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#E4572E", marginBottom: 11, fontWeight: 700 },

  siblingBox: { background: COLOR.lavenderSoft, border: "1px solid #DCD6F7", borderRadius: 14, padding: "15px 17px" },
  siblingLabel: { display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6C5FD1", marginBottom: 11, fontWeight: 700 },

  formRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 },
  formField: { display: "flex", alignItems: "center", gap: 7, background: COLOR.bg, borderRadius: 12, padding: "10px 14px", flex: "1 1 140px", minWidth: 0 },
  formFieldLabel: { fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12, color: COLOR.inkMuted, flexShrink: 0 },
  formInput: { border: "none", background: "transparent", flex: 1, minWidth: 0, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 16, color: COLOR.ink, textAlign: "right", fontVariantNumeric: "tabular-nums" },
  formUnit: { fontFamily: FONT_BODY, fontSize: 12, color: COLOR.inkMuted, flexShrink: 0 },

  stampBtn: { display: "flex", alignItems: "center", gap: 6, border: "none", background: COLOR.teal, color: "#fff", borderRadius: 12, padding: "11px 18px", fontSize: 13.5, fontFamily: FONT_BODY, fontWeight: 700, cursor: "pointer" },
  saveMsg: { fontSize: 12.5, fontFamily: FONT_BODY, fontWeight: 600, color: COLOR.teal, marginTop: 9 },

  chartsCol: { display: "flex", flexDirection: "column", gap: 24, marginTop: 20 },
  chartBox: { minWidth: 0 },
  chartFootnote: { fontFamily: FONT_BODY, fontSize: 11, color: COLOR.inkMuted, marginTop: 8, lineHeight: 1.5 },
  chartTitle: { fontFamily: FONT_BODY, fontSize: 11, color: COLOR.inkMuted, marginBottom: 5, letterSpacing: "0.03em", fontWeight: 700 },

  blankLabel: { display: "block", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11.5, color: COLOR.inkMuted, marginTop: 14, marginBottom: 5 },
  blankInput: { width: "100%", padding: "10px 12px", borderRadius: 12, border: `1px solid ${COLOR.border}`, fontSize: 14, fontFamily: FONT_BODY, background: COLOR.bg },
  footer: { fontFamily: FONT_BODY, textAlign: "center", fontSize: 11, color: COLOR.inkMuted, marginTop: 24, letterSpacing: "0.01em" },

  // ---- Auth / FamilySetup / child selector additions ----
  linkBtn: { border: "none", background: "none", color: COLOR.teal, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0, textDecoration: "underline" },
  formGroup: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 },
  memberRow: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" },
  memberInput: { flex: "1 1 140px", padding: "9px 12px", borderRadius: 12, border: `1px solid ${COLOR.border}`, fontSize: 13.5, fontFamily: FONT_BODY, background: COLOR.bg },
  memberDateInput: { flex: "0 1 150px", padding: "9px 12px", borderRadius: 12, border: `1px solid ${COLOR.border}`, fontSize: 13.5, fontFamily: FONT_BODY, background: COLOR.bg },
  removeBtn: { border: `1px solid #FFD4C6`, background: COLOR.coralSoft, color: "#E4572E", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },
  addRowBtn: { display: "flex", alignItems: "center", gap: 6, border: `1.5px dashed ${COLOR.border}`, background: "transparent", color: COLOR.inkMuted, borderRadius: 12, padding: "8px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 2, marginBottom: 18 },

  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  childTabs: { display: "flex", gap: 6, overflowX: "auto", marginBottom: 14 },
  childTab: { flexShrink: 0, border: `1px solid ${COLOR.border}`, background: COLOR.card, color: COLOR.inkMuted, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, padding: "7px 13px", borderRadius: 12, cursor: "pointer" },
  childTabActive: { background: COLOR.teal, color: "#fff", borderColor: COLOR.teal },
  iconBtn: { border: `1px solid ${COLOR.border}`, background: COLOR.card, borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLOR.inkMuted },

  // ---- Photos ----
  photoThumbWrap: { position: "relative", width: 64, height: 64, flexShrink: 0 },
  photoThumb: { width: 64, height: 64, objectFit: "cover", borderRadius: 12, border: `1px solid ${COLOR.border}`, background: COLOR.bg },
  photoRemoveBtn: { position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "1px solid #FFD4C6", background: COLOR.card, color: "#E4572E", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  photoUploadBtn: { display: "inline-flex", alignItems: "center", gap: 6, border: `1.5px dashed ${COLOR.border}`, borderRadius: 12, padding: "8px 13px", fontSize: 12.5, fontWeight: 600, color: COLOR.inkMuted, cursor: "pointer", fontFamily: FONT_BODY },

  // ---- Quick topic tips (eten/slapen/huilen) ----
  quickTipsBox: { background: COLOR.amberSoft, border: "1px solid #FBE1AE", borderRadius: 16, padding: "12px 14px", marginBottom: 14 },
  quickTipsRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  topicChip: { display: "flex", alignItems: "center", gap: 6, border: "1px solid #FBE1AE", background: COLOR.card, color: COLOR.amberText, borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontFamily: FONT_BODY, fontWeight: 600, cursor: "pointer" },
  topicChipActive: { background: COLOR.amber, color: "#fff", borderColor: COLOR.amber },

  // ---- Journal (verslagje per week) ----
  journalTextarea: { width: "100%", padding: "12px 14px", borderRadius: 14, border: `1px solid ${COLOR.border}`, fontSize: 14, fontFamily: FONT_BODY, color: COLOR.ink, resize: "vertical", lineHeight: 1.55, background: COLOR.bg },
  journalMicBtn: { display: "flex", alignItems: "center", gap: 6, border: `1px solid ${COLOR.border}`, background: COLOR.card, color: COLOR.inkMuted, borderRadius: 12, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, fontFamily: FONT_BODY, cursor: "pointer" },
  journalMicBtnActive: { background: COLOR.lavender, color: "#fff", borderColor: COLOR.lavender },
  journalRecordingHint: { fontSize: 11.5, color: COLOR.lavender, marginTop: 6, fontFamily: FONT_BODY, fontWeight: 600 },
  journalOtherEntry: { background: COLOR.lavenderSoft, border: "1px solid #DCD6F7", borderRadius: 12, padding: "10px 13px", fontSize: 14, color: COLOR.ink },
  journalAuthor: { fontSize: 11, fontWeight: 700, color: "#6C5FD1", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 },

  // ---- Week header card (persistent across tabs) + bottom navigation ----
  weekHeaderCard: {
    background: COLOR.card, border: `1px solid ${COLOR.border}`, borderRadius: 18, padding: "16px 18px",
    marginBottom: 14, boxShadow: "0 1px 2px rgba(30,42,51,0.03), 0 10px 22px -16px rgba(30,42,51,0.12)",
  },
  bottomNav: {
    position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 20,
    display: "flex", background: COLOR.card, borderRadius: 20, border: `1px solid ${COLOR.border}`,
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    boxShadow: "0 12px 28px -10px rgba(30,42,51,0.22)",
    maxWidth: 640, margin: "0 auto",
  },
  bottomNavBtn: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    border: "none", background: "transparent", color: COLOR.inkMuted, padding: "10px 4px",
    margin: 6, fontSize: 10.5, fontFamily: FONT_BODY, fontWeight: 600, cursor: "pointer", borderRadius: 14,
  },
  bottomNavBtnActive: { color: "#fff", fontWeight: 700 },

  // ---- Milestones checklist ----
  milestoneRow: { display: "flex", alignItems: "center", gap: 10, padding: "8px 2px", cursor: "pointer" },
  milestoneCheck: { width: 22, height: 22, borderRadius: 7, border: "2px solid #E7EAF0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  milestoneCheckDone: { background: "#0FB8A6", borderColor: "#0FB8A6" },
  milestoneLabel: { fontSize: 14, color: "#1E2530", flex: 1 },
  milestoneLabelDone: { color: "#6B7685", textDecoration: "line-through" },
  milestoneDate: { fontSize: 11.5, color: "#0FB8A6", fontWeight: 600, flexShrink: 0 },

  // ---- Sub-tabs within a main tab (e.g. Groei: Meting / Mijlpalen) ----
  subTabRow: { display: "flex", gap: 6, marginBottom: 14, background: "#EDF1F3", borderRadius: 12, padding: 4 },
  subTab: { flex: 1, border: "none", background: "transparent", color: "#6B7685", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, padding: "8px 10px", borderRadius: 9, cursor: "pointer" },
  subTabActive: { background: "#FFFFFF", color: "#1E2530", boxShadow: "0 1px 2px rgba(30,42,51,0.08)" },
};

export const COLORS = COLOR;
