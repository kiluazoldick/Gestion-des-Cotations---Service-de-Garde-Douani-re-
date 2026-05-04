"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Mail,
  Lock,
  LogIn,
  CalendarRange,
  Users,
  Briefcase,
  History,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    if (data?.session) {
      toast.success("Connexion réussie");
      router.push("/");
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Partie gauche - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Bienvenue</h1>
            <p className="text-gray-500 mt-2">
              Connectez-vous pour accéder à votre espace de gestion des gardes
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-gray-900 placeholder:text-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 text-white py-2.5 rounded-xl hover:bg-blue-900 transition flex items-center justify-center gap-2 font-medium"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <a
              href="/register"
              className="text-blue-700 font-medium hover:underline"
            >
              Créer un compte
            </a>
          </p>
        </div>
      </div>

      {/* Partie droite - Présentation */}
      <div className="hidden lg:flex flex-1 bg-blue-50 p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <div className="w-12 h-12 bg-blue-800 rounded-2xl flex items-center justify-center mb-6">
              <CalendarRange className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Gestion des gardes simplifiée
            </h2>
            <p className="text-gray-600 mt-2">
              Organisez les plannings de votre équipe en quelques clics
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Users className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gestion des agents</p>
                <p className="text-sm text-gray-500">
                  Ajoutez, modifiez et suivez les disponibilités
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Briefcase className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Postes personnalisables
                </p>
                <p className="text-sm text-gray-500">
                  Définissez vos propres types de garde
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <CalendarRange className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Génération automatique
                </p>
                <p className="text-sm text-gray-500">
                  Planning équitable généré en un clic
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <History className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Historique complet</p>
                <p className="text-sm text-gray-500">
                  Retrouvez toutes vos cotations passées
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
