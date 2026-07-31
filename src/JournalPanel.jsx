import React, { useState, useEffect, useRef } from "react";
import { Mic, Square as StopIcon, Save } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";

export default function JournalPanel({ childId, week, entries, onChanged, myName, partnerName }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [supported, setSupported] = useState(true);
  const [userId, setUserId] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const weekEntries = entries.filter(e => e.week === week);
  const myEntry = userId ? weekEntries.find(e => e.user_id === userId) : null;
  const otherEntries = userId ? weekEntries.filter(e => e.user_id !== userId) : weekEntries;

  useEffect(() => {
    setText(myEntry?.text || "");
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, userId]);

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "nl-NL";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript.trim()) {
        setText(prev => (prev ? prev.trim() + " " : "") + finalTranscript.trim());
      }
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const save = async () => {
    if (!userId) return;
    const row = { child_id: childId, week, user_id: userId, text: text.trim(), updated_at: new Date().toISOString() };
    const { error } = await supabase.from("journal_entries").upsert(row, { onConflict: "child_id,week,user_id" });
    if (error) {
      setSaveMsg("Opslaan mislukt.");
    } else {
      onChanged([...entries.filter(e => !(e.week === week && e.user_id === userId)), row]);
      setSaveMsg("Opgeslagen.");
    }
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const authorLabel = (entry) => {
    if (entry.user_id === userId) return myName || "Jij";
    return partnerName || "Partner";
  };

  return (
    <div>
      {otherEntries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {otherEntries.map((e, i) => (
            <div key={i} style={styles.journalOtherEntry}>
              <div style={styles.journalAuthor}>{authorLabel(e)}</div>
              <div>{e.text}</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.journalAuthor}>{myName ? `Jouw verslagje (${myName})` : "Jouw verslagje"}</div>
      <textarea
        className="gb-forminput"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Typ hier je verslagje, of spreek 'm in met het microfoontje…"
        style={{ ...styles.journalTextarea, marginTop: 6 }}
        rows={4}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
        {supported ? (
          <button
            type="button"
            className="gb-navbtn"
            style={{ ...styles.journalMicBtn, ...(recording ? styles.journalMicBtnActive : {}) }}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? <StopIcon size={13} /> : <Mic size={13} />}
            {recording ? "Stop opname" : "Inspreken"}
          </button>
        ) : (
          <span style={{ fontSize: 11.5, color: "#9AA3AF", fontFamily: "'Inter', sans-serif" }}>
            Inspreken wordt niet ondersteund in deze browser — typen werkt wel.
          </span>
        )}
        <button className="gb-stampbtn" style={styles.stampBtn} onClick={save}>
          <Save size={14} /> Opslaan
        </button>
        {saveMsg && <span style={styles.saveMsg}>{saveMsg}</span>}
      </div>
      {recording && <div style={styles.journalRecordingHint}>● Aan het luisteren… spreek rustig, tik op "Stop opname" als je klaar bent.</div>}
    </div>
  );
}
