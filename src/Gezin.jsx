import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft, Star } from "lucide-react";
import { supabase } from "./supabaseClient.js";
import { styles } from "./styles.js";

export default function Gezin({ child, myName, partnerName, onBack }) {
  const [ratings, setRatings] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      setLoaded(false);
      const { data: userData } = await supabase.auth.getUser();
      setMyUserId(userData.user?.id || null);
      const { data } = await supabase
        .from("week_ratings")
        .select("week, user_id, rating")
        .eq("child_id", child.id)
        .order("week", { ascending: true });
      setRatings(data || []);
      setLoaded(true);
    })();
  }, [child.id]);

  const chartData = useMemo(() => {
    const out = [];
    for (let w = 0; w <= 52; w++) {
      const mine = ratings.find(r => r.week === w && r.user_id === myUserId);
      const other = ratings.find(r => r.week === w && r.user_id !== myUserId);
      out.push({ week: w, jij: mine?.rating ?? null, partner: other?.rating ?? null });
    }
    return out;
  }, [ratings, myUserId]);

  const avg = (userId) => {
    const rows = ratings.filter(r => (userId === "me" ? r.user_id === myUserId : r.user_id !== myUserId));
    if (!rows.length) return null;
    return (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1);
  };

  if (!loaded) return <div style={{ padding: 40, fontFamily: "'Inter', sans-serif" }}>Gezinsoverzicht laden…</div>;

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.container, maxWidth: 720 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <button className="gb-navbtn" style={{ ...styles.iconBtn, width: "auto", padding: "0 14px", gap: 6, display: "flex" }} onClick={onBack}>
            <ArrowLeft size={15} /> Terug
          </button>
        </div>

        <div style={styles.page}>
          <div style={styles.pageLabel}>Gezin</div>
          <h1 style={styles.h1}>Hoe ging het jaar, samen bekeken</h1>
          <p style={styles.p}>Jullie weekbeoordelingen naast elkaar, over alle 52 weken.</p>

          <div style={{ display: "flex", gap: 24, marginTop: 16, marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Star size={16} color="#0FB8A6" fill="#0FB8A6" />
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18 }}>{avg("me") ?? "—"}</div>
                <div style={{ fontSize: 11, color: "#6B7685" }}>{myName || "Jij"}, gemiddeld</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Star size={16} color="#8B7FE0" fill="#8B7FE0" />
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18 }}>{avg("other") ?? "—"}</div>
                <div style={{ fontSize: 11, color: "#6B7685" }}>{partnerName || "Partner"}, gemiddeld</div>
              </div>
            </div>
          </div>

          <div style={styles.rule} />

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E7EAF0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#6B7685", fontFamily: "Inter" }} label={{ value: "week", position: "insideBottom", offset: -2, fontSize: 10, fill: "#9AA3AF" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7685", fontFamily: "Inter" }} width={24} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: "Inter", fontSize: 12 }} />
              <Line type="monotone" dataKey="jij" name={myName || "Jij"} stroke="#0FB8A6" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="partner" name={partnerName || "Partner"} stroke="#8B7FE0" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>

          {ratings.length === 0 && (
            <p style={{ ...styles.p, textAlign: "center", marginTop: 12 }}>
              Nog geen beoordelingen ingevuld — die verschijnen hier zodra jullie bij "Foto's & verslag" een week hebben beoordeeld.
            </p>
          )}

          <div style={styles.footer}>Gemaakt met Groeiboekje</div>
        </div>
      </div>
    </div>
  );
}
