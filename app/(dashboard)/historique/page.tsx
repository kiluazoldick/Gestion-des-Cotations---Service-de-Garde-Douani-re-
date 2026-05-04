"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { History as HistoryIcon, Calendar, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SemaineHistorique {
  id: string;
  semaine_id: string;
  date_generation: string;
  validee: boolean;
}

export default function HistoriquePage() {
  const [semaines, setSemaines] = useState<SemaineHistorique[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    const { data, error } = await supabase
      .from("historique_semaines")
      .select("*")
      .order("date_generation", { ascending: false })
      .limit(20);

    if (error) {
      toast.error("Erreur lors du chargement");
    } else {
      setSemaines(data || []);
    }
    setLoading(false);
  };

  const formatSemaineId = (semaineId: string): string => {
    const [year, week] = semaineId.split("-W");
    return `Semaine ${week} - ${year}`;
  };

  const getDateRangeFromWeekId = (semaineId: string): string => {
    const match = semaineId.match(/(\d+)-W(\d+)/);
    if (!match) return semaineId;

    const year = parseInt(match[1]);
    const week = parseInt(match[2]);

    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7;
    const tuesday = new Date(firstDayOfYear);
    tuesday.setDate(firstDayOfYear.getDate() + daysOffset + 1);

    const monday = new Date(tuesday);
    monday.setDate(tuesday.getDate() + 6);

    return `du ${format(tuesday, "dd/MM", { locale: fr })} au ${format(monday, "dd/MM/yyyy", { locale: fr })}`;
  };

  const handleViewWeek = (semaineId: string) => {
    window.location.href = `/cotations?week=${semaineId}`;
  };

  const handleExport = (semaine: SemaineHistorique) => {
    toast.success(`Export de ${formatSemaineId(semaine.semaine_id)} lancé`);
    // Logique d'export à implémenter
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <HistoryIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Historique des cotations
        </h1>
        <p className="text-gray-500 mt-1">
          Consultez et exportez les cotations précédentes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {semaines.map((semaine) => (
          <div
            key={semaine.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-700" />
              </div>
              {semaine.validee && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Validée
                </span>
              )}
            </div>

            <h3 className="font-semibold text-gray-900">
              {formatSemaineId(semaine.semaine_id)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {getDateRangeFromWeekId(semaine.semaine_id)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Générée le{" "}
              {format(new Date(semaine.date_generation), "dd/MM/yyyy à HH:mm", {
                locale: fr,
              })}
            </p>

            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleViewWeek(semaine.semaine_id)}
                className="flex-1 px-3 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Voir
              </button>
              <button
                onClick={() => handleExport(semaine)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>
        ))}
      </div>

      {semaines.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <HistoryIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune cotation dans l'historique</p>
          <a
            href="/cotations"
            className="inline-block mt-3 text-blue-700 font-medium hover:underline"
          >
            Générer votre première cotation
          </a>
        </div>
      )}
    </div>
  );
}
