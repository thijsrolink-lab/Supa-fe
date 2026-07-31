import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient.js";
import Auth from "./Auth.jsx";
import FamilySetup from "./FamilySetup.jsx";
import Tracker from "./Tracker.jsx";
import Jaarverslag from "./Jaarverslag.jsx";

function GlobalFonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

      * { box-sizing: border-box; }
      .gb-mono { font-variant-numeric: tabular-nums; }

      .gb-tab { transition: background-color 150ms ease, color 150ms ease, box-shadow 150ms ease; }
      .gb-tab:hover { background: #E3F7F4; color: #0C9A8A; }
      .gb-tab.gb-tab-active:hover { background: #0FB8A6; }
      .gb-tab:focus-visible, .gb-navbtn:focus-visible, .gb-stampbtn:focus-visible, .gb-forminput:focus-visible {
        outline: 2px solid #0FB8A6; outline-offset: 2px;
      }

      .gb-navbtn { transition: background-color 150ms ease, border-color 150ms ease, transform 100ms ease; }
      .gb-navbtn:hover { background: #E3F7F4; border-color: #0FB8A6; }
      .gb-navbtn:active { transform: scale(0.92); }

      .gb-stampbtn { transition: background-color 150ms ease, box-shadow 150ms ease, transform 100ms ease; }
      .gb-stampbtn:hover { box-shadow: 0 6px 16px -4px rgba(15,184,166,0.5); }
      .gb-stampbtn:active { transform: scale(0.97); }
      .gb-stampbtn:disabled { opacity: 0.6; cursor: default; }

      .gb-formfield { transition: box-shadow 150ms ease; }
      .gb-formfield:focus-within { box-shadow: 0 0 0 2px #0FB8A6; }
      .gb-forminput { outline: none; }

      @keyframes gbFadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      .gb-fade { animation: gbFadeIn 260ms cubic-bezier(0.16, 1, 0.3, 1); }

      .gb-tabstrip::-webkit-scrollbar { height: 4px; }
      .gb-tabstrip::-webkit-scrollbar-thumb { background: #E7EAF0; border-radius: 4px; }

      ::selection { background: #0FB8A6; color: #fff; }

      @keyframes gbSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .gb-spin { animation: gbSpin 800ms linear infinite; }

      @media (prefers-reduced-motion: reduce) {
        .gb-fade { animation: none; }
        .gb-tab, .gb-navbtn, .gb-stampbtn, .gb-formfield { transition: none; }
      }
    `}</style>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [family, setFamily] = useState(undefined); // undefined = loading, null = none yet
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [editingFamily, setEditingFamily] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) { setFamily(undefined); setSelectedChildId(null); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadFamily = useCallback(async () => {
    if (!session) return;
    setFamily(undefined);
    const { data: membership, error: memberError } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (memberError || !membership) {
      setFamily(null);
      return;
    }
    const { data: fam, error } = await supabase
      .from("families")
      .select("id, father_name, mother_name, children(id, name, birth_date, gender), siblings(id, name, birth_date, gender)")
      .eq("id", membership.family_id)
      .maybeSingle();
    if (error || !fam) {
      setFamily(null);
      return;
    }
    setFamily(fam);
    setSelectedChildId(prev => prev || (fam.children?.[0]?.id ?? null));
    setEditingFamily(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => { loadFamily(); }, [loadFamily]);

  if (session === undefined) {
    return <><GlobalFonts /><div style={{ padding: 40, fontFamily: "'Inter', sans-serif" }}>Even laden…</div></>;
  }
  if (!session) {
    return <><GlobalFonts /><Auth /></>;
  }
  if (family === undefined) {
    return <><GlobalFonts /><div style={{ padding: 40, fontFamily: "'Inter', sans-serif" }}>Gezin laden…</div></>;
  }
  if (!family || editingFamily || (family.children || []).length === 0) {
    return (
      <>
        <GlobalFonts />
        <FamilySetup
          existingFamily={family || null}
          onSaved={loadFamily}
          onLogout={() => supabase.auth.signOut()}
        />
      </>
    );
  }

  const children = family.children;
  const activeChild = children.find(c => c.id === selectedChildId) || children[0];
  const siblings = [
    ...children.filter(c => c.id !== activeChild.id).map(c => ({ name: c.name, birth_date: c.birth_date, gender: c.gender })),
    ...(family.siblings || []).map(s => ({ name: s.name, birth_date: s.birth_date, gender: s.gender })),
  ];
  const partnerName = family.mother_name || family.father_name || null;

  if (showReport) {
    return (
      <>
        <GlobalFonts />
        <Jaarverslag
          child={activeChild}
          siblings={siblings}
          partnerName={partnerName}
          onBack={() => setShowReport(false)}
        />
      </>
    );
  }

  return (
    <>
      <GlobalFonts />
      <Tracker
        child={activeChild}
        siblings={siblings}
        partnerName={partnerName}
        childOptions={children}
        familyId={family.id}
        onSelectChild={setSelectedChildId}
        onEditFamily={() => setEditingFamily(true)}
        onLogout={() => supabase.auth.signOut()}
        onOpenReport={() => setShowReport(true)}
      />
    </>
  );
}
