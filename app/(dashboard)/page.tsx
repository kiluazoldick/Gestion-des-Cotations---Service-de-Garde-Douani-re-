"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Briefcase,
  CalendarCheck,
  Clock,
  TrendingUp,
  Sparkles,
  MousePointerClick,
  FileSpreadsheet,
} from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface Stats {
  agentsActifs: number;
  postesCount: number;
  cotationsCount: number;
  semainesCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    agentsActifs: 0,
    postesCount: 0,
    cotationsCount: 0,
    semainesCount: 0,
  });
  const [lastWeek, setLastWeek] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadStats();
    getCurrentWeek();
  }, []);

  const getCurrentWeek = () => {
    const today = new Date();
    const tuesday = startOfWeek(today, { weekStartsOn: 2 });
    const monday = addDays(tuesday, 6);
    setLastWeek(
      `Semaine du ${format(tuesday, "dd/MM", { locale: fr })} au ${format(monday, "dd/MM/yyyy", { locale: fr })}`,
    );
  };

  const loadStats = async () => {
    const { count: agentsCount } = await supabase
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("actif", true);

    const { count: postesCount } = await supabase
      .from("postes")
      .select("*", { count: "exact", head: true });

    const { count: cotationsCount } = await supabase
      .from("cotations")
      .select("*", { count: "exact", head: true });

    const { count: semainesCount } = await supabase
      .from("historique_semaines")
      .select("*", { count: "exact", head: true });

    setStats({
      agentsActifs: agentsCount || 0,
      postesCount: postesCount || 0,
      cotationsCount: cotationsCount || 0,
      semainesCount: semainesCount || 0,
    });
  };

  const statsCards = [
    {
      title: "Agents actifs",
      value: stats.agentsActifs,
      icon: Users,
      color: "bg-blue-700",
    },
    {
      title: "Postes de garde",
      value: stats.postesCount,
      icon: Briefcase,
      color: "bg-green-700",
    },
    {
      title: "Cotations totales",
      value: stats.cotationsCount,
      icon: CalendarCheck,
      color: "bg-blue-600",
    },
    {
      title: "Semaines historiques",
      value: stats.semainesCount,
      icon: Clock,
      color: "bg-green-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">{lastWeek}</p>
        </div>
        <a
          href="/cotations"
          className="bg-blue-700 text-white px-5 py-2.5 rounded-xl hover:bg-blue-800 transition flex items-center gap-2 font-medium shadow-sm"
        >
          <TrendingUp className="w-4 h-4" />
          Générer cotation
        </a>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide d'utilisation */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-blue-50/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Comment utiliser l'application
            </h2>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            3 étapes simples pour organiser vos gardes
          </p>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">
                  1. Configurez votre équipe
                </h3>
                <p className="text-sm text-gray-500">
                  Ajoutez les agents et définissez les postes de garde (Matin,
                  Soir, Nuit).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">
                  2. Générez la cotation
                </h3>
                <p className="text-sm text-gray-500">
                  Cliquez sur "Générer" pour créer un planning équitable
                  automatiquement.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">
                  3. Ajustez et imprimez
                </h3>
                <p className="text-sm text-gray-500">
                  Modifiez manuellement si besoin, puis imprimez ou exportez
                  votre planning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a
            href="/agents"
            className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition"
          >
            <Users className="w-7 h-7 text-blue-700 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Gérer agents
            </span>
          </a>
          <a
            href="/postes"
            className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition"
          >
            <Briefcase className="w-7 h-7 text-green-700 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Configurer postes
            </span>
          </a>
          <a
            href="/cotations"
            className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition"
          >
            <CalendarCheck className="w-7 h-7 text-blue-700 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Voir cotation
            </span>
          </a>
          <a
            href="/historique"
            className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition"
          >
            <Clock className="w-7 h-7 text-green-700 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Historique
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
