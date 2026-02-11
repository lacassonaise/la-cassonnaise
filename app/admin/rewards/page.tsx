"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Row = {
  reward_used: string;
  count: number;
};

export default function AdminRewardsPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase
      .rpc("count_rewards_used")
      .then(({ data }) => setRows(data ?? []));
  }, []);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">
        Récompenses utilisées
      </h1>

      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.reward_used}
            className="flex justify-between rounded-xl border bg-white p-4"
          >
            <span>
              {r.reward_used === "pizza" && "🍕 Pizza offerte"}
              {r.reward_used === "drink" && "🥤 Boisson offerte"}
            </span>
            <strong>{r.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
