"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }: { data: Notification[] | null }) => setItems(data ?? []));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("my-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload: any) => {
          setItems((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function markAsRead(id: string) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Notifications</h1>

      <div className="space-y-3">
        {items.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border p-4 ${n.read ? "bg-gray-50" : "bg-white"
              }`}
            onClick={() => markAsRead(n.id)}
          >
            <div className="font-semibold">{n.title}</div>
            <div className="text-sm text-gray-600">{n.body}</div>
            <div className="mt-1 text-xs text-gray-400">
              {new Date(n.created_at).toLocaleString("fr-FR")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
