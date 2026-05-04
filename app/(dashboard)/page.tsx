"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Briefcase,
  CalendarCheck,
  Clock,
  TrendingUp,
  AlertCircle,
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
      color: "bg-blue-500",
    },
    {
      title: "Postes de garde",
      value: stats.postesCount,
      icon: Briefcase,
      color: "bg-green-500",
    },
    {
      title: "Cotations totales",
      value: stats.cotationsCount,
      icon: CalendarCheck,
      color: "bg-purple-500",
    },
    {
      title: "Semaines historiques",
      value: stats.semainesCount,
      icon: Clock,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">{lastWeek}</p>
        </div>
        <a
          href="/cotations"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
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
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/agents"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
          >
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Gérer agents
            </span>
          </a>
          <a
            href="/postes"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
          >
            <Briefcase className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Configurer postes
            </span>
          </a>
          <a
            href="/cotations"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
          >
            <CalendarCheck className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Voir cotation
            </span>
          </a>
          <a
            href="/historique"
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
          >
            <Clock className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              Historique
            </span>
          </a>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-yellow-800">
            <strong>Conseil :</strong> Les gardes sont générées automatiquement
            du mardi au lundi. Vous pouvez modifier manuellement chaque cotation
            après génération.
          </p>
        </div>
      </div>
    </div>
  );
}
