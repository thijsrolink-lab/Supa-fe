import React, { useState, useEffect, useRef } from "react";
import { Mic, Square as StopIcon, Save } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";

export default function JournalPanel({ childId, week, entries, onChanged }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  useEffect(() => {
    const existing = entries.find(e => e.week === week);
    setText(existing?.text || "");
    // Stop een eventuele lopende opname als er van week gewisseld wordt.
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week]);

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
    const row = { child_id: childId, week, text: text.trim(), updated_at: new Date().toISOString() };
    const { error } = await supabase.from("journal_entries").upsert(row, { onConflict: "child_id,week" });
    if (error) {
      setSaveMsg("Opslaan mislukt.");
    } else {
      onChanged([...entries.filter(e => e.week !== week), row]);
      setSaveMsg("Opgeslagen.");
    }
    setTimeout(() => setSaveMsg(""), 2000);
  };

  return (
    <div>
      <textarea
        className="gb-forminput"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Typ hier je verslagje, of spreek 'm in met het microfoontje…"
        style={styles.journalTextarea}
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
          <span style={{ fontSize: 11.5, color: "#8A8368", fontFamily: "'IBM Plex Mono', monospace" }}>
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
