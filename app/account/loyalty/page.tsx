"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Row = {
  user_id: string;
  points: number;
  tier: string;
  updated_at: string;
};

export default function AdminLoyaltyPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase
      .from("loyalty_accounts")
      .select("user_id, points, tier, updated_at")
      .order("points", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, []);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">
        Fidélité clients
      </h1>

      <table className="w-full border rounded-xl overflow-hidden">
        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="p-3 text-left">Client</th>
            <th className="p-3 text-right">Points</th>
            <th className="p-3 text-center">Tier</th>
            <th className="p-3 text-right">Dernière MAJ</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.user_id} className="border-t text-sm">
              <td className="p-3">{r.user_id.slice(0, 8)}</td>
              <td className="p-3 text-right font-semibold">
                {r.points}
              </td>
              <td className="p-3 text-center">
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {r.tier}
                </span>
              </td>
              <td className="p-3 text-right text-gray-500">
                {new Date(r.updated_at).toLocaleDateString("fr-FR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
