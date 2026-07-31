import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { supabase } from "./supabaseClient.js";

export default function WeekRating({ childId, week }) {
  const [myRating, setMyRating] = useState(0);
  const [others, setOthers] = useState([]); // [{user_id, rating}]

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("week_ratings")
        .select("user_id, rating")
        .eq("child_id", childId)
        .eq("week", week);
      const mine = (data || []).find(r => r.user_id === user.id);
      setMyRating(mine?.rating || 0);
      setOthers((data || []).filter(r => r.user_id !== user.id));
    })();
  }, [childId, week]);

  const rate = async (value) => {
    setMyRating(value);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("week_ratings")
      .upsert({ child_id: childId, user_id: user.id, week, rating: value, updated_at: new Date().toISOString() }, { onConflict: "child_id,user_id,week" });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: others.length ? 8 : 0 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => rate(n)}
            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2 }}
            aria-label={`${n} van 5`}
          >
            <Star size={26} fill={n <= myRating ? "#F5A524" : "none"} color={n <= myRating ? "#F5A524" : "#D8DCE3"} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      {others.length > 0 && (
        <div style={{ fontSize: 12, color: "#6B7685" }}>
          Partner gaf deze week: {others.map(o => "★".repeat(o.rating)).join(", ")}
        </div>
      )}
    </div>
  );
}
