"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function resetPassword() {
        if (!email) {
            setError("Entrez votre email d'abord pour réinitialiser le mot de passe.");
            setMessage(null);
            return;
        }
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/account",
        });

        setLoading(false);
        if (error) {
            setError(error.message);
            setMessage(null);
        } else {
            setMessage("Email de réinitialisation envoyé. Vérifiez votre boîte de réception.");
        }
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        /* =====================
           AUTH SUPABASE
        ===================== */
        const { data, error: authError } =
            await supabase.auth.signInWithPassword({
                email,
                password,
            });

        if (authError || !data.user) {
            console.error("Erreur de connexion Supabase :", authError?.message || authError);
            setError("Identifiants invalides");
            setLoading(false);
            return;
        }

        /* =====================
           CHECK ROLE ADMIN
        ===================== */
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", data.user.id)
            .single();

        if (profileError || profile?.role !== "admin") {
            await supabase.auth.signOut();
            setError("Accès réservé à l’administration");
            setLoading(false);
            return;
        }

        /* =====================
           REDIRECT DASHBOARD
        ===================== */
        router.push("/admin/dashboard");
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <form
                onSubmit={handleLogin}
                className="w-full max-w-sm rounded-2xl bg-white p-8 shadow"
            >
                <h1 className="mb-6 text-center text-2xl font-bold">
                    Connexion admin
                </h1>

                {error && (
                    <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">
                        {message}
                    </div>
                )}

                <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium">
                        Email
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2"
                    />
                </div>

                <div className="mb-6">
                    <label className="mb-1 block text-sm font-medium">
                        Mot de passe
                    </label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2"
                    />
                </div>

                <div className="mb-6 flex justify-end">
                    <button
                        type="button"
                        onClick={resetPassword}
                        className="text-sm font-medium text-gray-500 hover:text-black hover:underline"
                    >
                        Mot de passe oublié ?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-black py-3 text-white font-semibold disabled:opacity-50"
                >
                    {loading ? "Chargement..." : "Se connecter"}
                </button>
            </form>
        </div>
    );
}