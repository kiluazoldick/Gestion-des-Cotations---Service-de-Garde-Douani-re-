"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  CalendarRange,
  RefreshCw,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { format, startOfWeek, addDays, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

interface Agent {
  id: string;
  nom: string;
  prenom: string;
  actif: boolean;
}

interface Poste {
  id: string;
  nom: string;
  ordre: number;
}

interface Cotation {
  id: string;
  date_jour: string;
  agent_id: string;
  poste_id: string;
  modifie_manuellement: boolean;
}

interface Indisponibilite {
  agent_id: string;
  date_debut: string;
  date_fin: string;
}

export default function CotationsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [postes, setPostes] = useState<Poste[]>([]);
  const [cotations, setCotations] = useState<Cotation[]>([]);
  const [indisponibilites, setIndisponibilites] = useState<Indisponibilite[]>(
    [],
  );
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  const [currentWeekId, setCurrentWeekId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [weekOffset]);

  const getWeekDays = (offset: number = 0) => {
    const today = new Date();
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + offset * 7);
    const tuesday = startOfWeek(baseDate, { weekStartsOn: 2 });
    return eachDayOfInterval({ start: tuesday, end: addDays(tuesday, 6) });
  };

  const getWeekId = (days: Date[]) => {
    if (days.length === 0) return "";
    const year = days[0].getFullYear();
    const weekNum = Math.ceil(
      ((days[0].getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7,
    );
    return `${year}-W${weekNum.toString().padStart(2, "0")}`;
  };

  const loadData = async () => {
    setLoading(true);
    const days = getWeekDays(weekOffset);
    setCurrentWeek(days);
    const weekId = getWeekId(days);
    setCurrentWeekId(weekId);

    const { data: agentsData } = await supabase
      .from("agents")
      .select("*")
      .eq("actif", true)
      .order("nom", { ascending: true });
    if (agentsData) setAgents(agentsData);

    const { data: postesData } = await supabase
      .from("postes")
      .select("*")
      .order("ordre", { ascending: true });
    if (postesData) setPostes(postesData);

    const startDate = format(days[0], "yyyy-MM-dd");
    const endDate = format(days[6], "yyyy-MM-dd");

    const { data: indispoData } = await supabase
      .from("indisponibilites")
      .select("*")
      .or(`date_debut.lte.${endDate},date_fin.gte.${startDate}`);
    if (indispoData) setIndisponibilites(indispoData);

    const { data: cotationsData } = await supabase
      .from("cotations")
      .select("*")
      .eq("semaine_id", weekId);
    if (cotationsData) {
      setCotations(cotationsData);
    } else {
      setCotations([]);
    }
    setLoading(false);
  };

  const isAgentIndisponible = (agentId: string, date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    return indisponibilites.some(
      (indispo) =>
        indispo.agent_id === agentId &&
        indispo.date_debut <= dateStr &&
        indispo.date_fin >= dateStr,
    );
  };

  const getAgentCotation = (
    agentId: string,
    date: Date,
  ): Cotation | undefined => {
    const dateStr = format(date, "yyyy-MM-dd");
    return cotations.find(
      (c) => c.agent_id === agentId && c.date_jour === dateStr,
    );
  };

  const getPosteForAgent = (agentId: string, date: Date): Poste | null => {
    const cotation = getAgentCotation(agentId, date);
    return cotation
      ? postes.find((p) => p.id === cotation.poste_id) || null
      : null;
  };

  const getAgentsForPoste = (posteId: string, date: Date): Agent[] => {
    const agentsWithPoste = cotations
      .filter(
        (c) =>
          c.poste_id === posteId && c.date_jour === format(date, "yyyy-MM-dd"),
      )
      .map((c) => agents.find((a) => a.id === c.agent_id))
      .filter((a) => a) as Agent[];
    return agentsWithPoste;
  };

  const handleGenerate = async () => {
    if (cotations.length > 0) {
      if (
        !confirm(
          "Une cotation existe déjà pour cette semaine. Voulez-vous la remplacer ?",
        )
      ) {
        return;
      }
    }
    setGenerating(true);
    const newCotations: Cotation[] = [];
    const assignmentCount: Record<string, number> = {};
    agents.forEach((a) => {
      assignmentCount[a.id] = 0;
    });

    for (const day of currentWeek) {
      const dateStr = format(day, "yyyy-MM-dd");
      let available = agents.filter((a) => !isAgentIndisponible(a.id, day));
      if (available.length === 0) {
        toast.error(
          `Aucun agent disponible pour le ${format(day, "EEEE d MMMM", { locale: fr })}`,
        );
        setGenerating(false);
        return;
      }
      available.sort((a, b) => assignmentCount[a.id] - assignmentCount[b.id]);
      for (const poste of postes) {
        if (available.length === 0) break;
        const selectedAgent = available.shift();
        if (selectedAgent) {
          newCotations.push({
            id: crypto.randomUUID(),
            date_jour: dateStr,
            agent_id: selectedAgent.id,
            poste_id: poste.id,
            modifie_manuellement: false,
          });
          assignmentCount[selectedAgent.id]++;
        }
      }
    }

    const { error } = await supabase
      .from("cotations")
      .upsert(newCotations.map((c) => ({ ...c, semaine_id: currentWeekId })));

    if (error) {
      toast.error("Erreur lors de la génération");
    } else {
      toast.success("Cotation générée avec succès");
      await loadData();
    }
    setGenerating(false);
  };

  const handleModifyCotation = async (
    agentId: string,
    date: Date,
    posteId: string,
  ) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existingCotation = getAgentCotation(agentId, date);
    if (existingCotation && existingCotation.poste_id === posteId) return;

    const agentWithSamePoste = cotations.find(
      (c) =>
        c.date_jour === dateStr &&
        c.poste_id === posteId &&
        c.agent_id !== agentId,
    );
    if (agentWithSamePoste && !existingCotation) {
      toast.error(`Ce poste est déjà attribué à un autre agent`);
      return;
    }

    setSaving(true);
    if (existingCotation) {
      const { error } = await supabase
        .from("cotations")
        .update({ poste_id: posteId, modifie_manuellement: true })
        .eq("id", existingCotation.id);
      if (error) toast.error("Erreur lors de la modification");
      else {
        toast.success("Cotation modifiée");
        await loadData();
      }
    } else {
      const { error } = await supabase.from("cotations").insert({
        id: crypto.randomUUID(),
        semaine_id: currentWeekId,
        date_jour: dateStr,
        agent_id: agentId,
        poste_id: posteId,
        modifie_manuellement: true,
      });
      if (error) toast.error("Erreur lors de l'ajout");
      else {
        toast.success("Cotation ajoutée");
        await loadData();
      }
    }
    setSaving(false);
  };

  const handlePrint = () => {
    const printContent = tableRef.current?.innerHTML;
    const originalTitle = document.title;
    document.title = `Cotation_${currentWeekId}`;
    const printWindow = window.open("", "_blank");
    if (printWindow && printContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cotation ${currentWeekId}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
                padding: 20px;
                margin: 0;
              }
              h1 {
                font-size: 18px;
                margin-bottom: 20px;
                color: #111;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
              }
              th, td {
                border: 1px solid #e5e5e5;
                padding: 10px 8px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background-color: #f5f5f5;
                font-weight: 600;
              }
              .indisponible {
                color: #dc2626;
                font-size: 11px;
              }
              .poste-assigne {
                font-weight: 500;
              }
              .footer {
                margin-top: 20px;
                font-size: 10px;
                color: #999;
                text-align: center;
              }
            </style>
          </head>
          <body>
            ${printContent}
            <div class="footer">Document généré par Garde Cotation - ${new Date().toLocaleDateString()}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
    document.title = originalTitle;
  };

  const weekNavigation = () => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setWeekOffset(weekOffset - 1)}
        className="p-2 hover:bg-gray-100 rounded-xl transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium text-gray-700">
        {weekOffset === 0
          ? "Semaine en cours"
          : weekOffset < 0
            ? `Il y a ${-weekOffset} semaine${-weekOffset > 1 ? "s" : ""}`
            : `Dans ${weekOffset} semaine${weekOffset > 1 ? "s" : ""}`}
      </span>
      <button
        onClick={() => setWeekOffset(weekOffset + 1)}
        className="p-2 hover:bg-gray-100 rounded-xl transition"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      {weekOffset !== 0 && (
        <button
          onClick={() => setWeekOffset(0)}
          className="ml-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Aujourd'hui
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cotation des gardes
          </h1>
          <p className="text-gray-500 mt-1">
            Semaine du {format(currentWeek[0], "dd MMMM", { locale: fr })} au{" "}
            {format(currentWeek[6], "dd MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {weekNavigation()}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50 font-medium"
          >
            <RefreshCw
              className={`w-4 h-4 ${generating ? "animate-spin" : ""}`}
            />
            {generating ? "Génération..." : "Générer"}
          </button>
          <button
            onClick={handlePrint}
            className="border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 font-medium"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Tableau à imprimer */}
      <div
        ref={tableRef}
        className="bg-white rounded-2xl border border-gray-100 overflow-x-auto shadow-sm print:shadow-none print:border-none"
      >
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:shadow-none,
            .print\\:border-none {
              visibility: visible;
            }
          }
        `}</style>
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50">
                Agents / Jours
              </th>
              {currentWeek.map((day, index) => {
                const isWeekend = day.getDay() === 6 || day.getDay() === 0;
                return (
                  <th key={index} className="p-4 text-center min-w-[120px]">
                    <div
                      className={`font-semibold ${isWeekend ? "text-red-600" : "text-gray-700"}`}
                    >
                      {format(day, "EEEE", { locale: fr })}
                    </div>
                    <div className="text-sm text-gray-400">
                      {format(day, "dd/MM", { locale: fr })}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const hasAnyIndispo = currentWeek.some((day) =>
                isAgentIndisponible(agent.id, day),
              );
              return (
                <tr
                  key={agent.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                >
                  <td className="p-4 sticky left-0 bg-white border-r border-gray-100">
                    <div className="font-medium text-gray-900">
                      {agent.prenom} {agent.nom}
                    </div>
                    {hasAnyIndispo && (
                      <span className="text-xs text-red-500 inline-flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        Indisponible
                      </span>
                    )}
                  </td>
                  {currentWeek.map((day, dayIndex) => {
                    const isIndisponible = isAgentIndisponible(agent.id, day);
                    const currentPoste = getPosteForAgent(agent.id, day);
                    return (
                      <td key={dayIndex} className="p-2 text-center">
                        {isIndisponible ? (
                          <div className="bg-red-50 text-red-500 p-2 rounded-xl text-sm">
                            Indisponible
                          </div>
                        ) : (
                          <select
                            value={currentPoste?.id || ""}
                            onChange={(e) =>
                              handleModifyCotation(
                                agent.id,
                                day,
                                e.target.value,
                              )
                            }
                            disabled={saving}
                            className={`w-full p-2 rounded-xl border text-sm transition cursor-pointer ${
                              currentPoste
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-gray-50 border-gray-200 text-gray-500"
                            } focus:outline-none focus:ring-1 focus:ring-gray-400`}
                          >
                            <option value="">-- Aucun --</option>
                            {postes.map((poste) => {
                              const agentsOnThisPoste = getAgentsForPoste(
                                poste.id,
                                day,
                              );
                              const isOccupied = agentsOnThisPoste.some(
                                (a) => a.id !== agent.id,
                              );
                              return (
                                <option
                                  key={poste.id}
                                  value={poste.id}
                                  disabled={isOccupied}
                                >
                                  {poste.nom} {isOccupied ? "(pris)" : ""}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
          <span className="text-sm text-gray-600">Poste assigné</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
          <span className="text-sm text-gray-600">Non assigné</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 rounded"></div>
          <span className="text-sm text-gray-600">Agent indisponible</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-gray-600">Modifiable manuellement</span>
        </div>
      </div>

      {cotations.length === 0 && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
          <p className="text-amber-800">Aucune cotation pour cette semaine</p>
          <button
            onClick={handleGenerate}
            className="mt-3 bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition"
          >
            Générer une cotation
          </button>
        </div>
      )}
    </div>
  );
}
