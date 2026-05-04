"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Mail, Lock, UserPlus, User, CalendarRange } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nom, prenom },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from("agents").insert({
        id: authData.user.id,
        email,
        nom,
        prenom,
        actif: true,
      });

      if (profileError) {
        console.error("Erreur profil:", profileError);
        toast.error("Compte créé mais erreur profil. Contactez admin.");
      } else {
        toast.success("Compte créé avec succès ! Connectez-vous.");
        router.push("/login");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Partie gauche - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Créer un compte
            </h1>
            <p className="text-gray-500 mt-2">
              Rejoignez votre équipe pour commencer à organiser les gardes
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-gray-900"
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prénom
                </label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-gray-900"
                  placeholder="Jean"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-gray-900"
                  placeholder="jean.dupont@example.com"
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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-gray-900"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 text-white py-2.5 rounded-xl hover:bg-green-800 transition flex items-center justify-center gap-2 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{" "}
            <a
              href="/login"
              className="text-blue-700 font-medium hover:underline"
            >
              Se connecter
            </a>
          </p>
        </div>
      </div>

      {/* Partie droite - Présentation */}
      <div className="hidden lg:flex flex-1 bg-green-50 p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="w-12 h-12 bg-green-700 rounded-2xl flex items-center justify-center mb-6">
            <CalendarRange className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Organisez vos gardes en toute simplicité
          </h2>
          <p className="text-gray-600 mt-2">
            Rejoignez de nombreux services qui utilisent déjà notre plateforme
          </p>
        </div>
      </div>
    </div>
  );
}
