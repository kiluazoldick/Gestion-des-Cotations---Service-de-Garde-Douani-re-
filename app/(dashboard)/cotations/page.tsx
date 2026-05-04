"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  CalendarRange,
  RefreshCw,
  Save,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
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

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [weekOffset]);

  const getWeekDays = (offset: number = 0) => {
    const today = new Date();
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + offset * 7);

    const tuesday = startOfWeek(baseDate, { weekStartsOn: 2 });
    return eachDayOfInterval({
      start: tuesday,
      end: addDays(tuesday, 6),
    });
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

    // Charger les jours de la semaine
    const days = getWeekDays(weekOffset);
    setCurrentWeek(days);
    const weekId = getWeekId(days);
    setCurrentWeekId(weekId);

    // Charger les agents actifs
    const { data: agentsData } = await supabase
      .from("agents")
      .select("*")
      .eq("actif", true)
      .order("nom", { ascending: true });

    if (agentsData) setAgents(agentsData);

    // Charger les postes
    const { data: postesData } = await supabase
      .from("postes")
      .select("*")
      .order("ordre", { ascending: true });

    if (postesData) setPostes(postesData);

    // Charger les indisponibilités de la semaine
    const startDate = format(days[0], "yyyy-MM-dd");
    const endDate = format(days[6], "yyyy-MM-dd");

    const { data: indispoData } = await supabase
      .from("indisponibilites")
      .select("*")
      .or(`date_debut.lte.${endDate},date_fin.gte.${startDate}`);

    if (indispoData) setIndisponibilites(indispoData);

    // Charger les cotations existantes pour cette semaine
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
    if (cotation) {
      return postes.find((p) => p.id === cotation.poste_id) || null;
    }
    return null;
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

    // Algorithme simple de rotation
    const newCotations: Cotation[] = [];
    const availableAgents = [...agents];

    // Compter combien de fois chaque agent a été assigné
    const assignmentCount: Record<string, number> = {};
    agents.forEach((a) => {
      assignmentCount[a.id] = 0;
    });

    for (const day of currentWeek) {
      const dateStr = format(day, "yyyy-MM-dd");

      // Filtrer les agents disponibles ce jour
      let available = agents.filter((a) => !isAgentIndisponible(a.id, day));

      if (available.length === 0) {
        toast.error(
          `Aucun agent disponible pour le ${format(day, "EEEE d MMMM", { locale: fr })}`,
        );
        setGenerating(false);
        return;
      }

      // Trier par nombre d'assignations (les moins sollicités d'abord)
      available.sort((a, b) => assignmentCount[a.id] - assignmentCount[b.id]);

      // Assigner chaque poste
      for (const poste of postes) {
        if (available.length === 0) break;

        // Prendre l'agent le moins sollicité
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

    // Sauvegarder en base
    const { error } = await supabase.from("cotations").upsert(
      newCotations.map((c) => ({
        ...c,
        semaine_id: currentWeekId,
      })),
    );

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

    if (existingCotation && existingCotation.poste_id === posteId) {
      return; // Même poste, rien à faire
    }

    // Vérifier si le poste est déjà pris par un autre agent ce jour
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
      // Modifier la cotation existante
      const { error } = await supabase
        .from("cotations")
        .update({ poste_id: posteId, modifie_manuellement: true })
        .eq("id", existingCotation.id);

      if (error) {
        toast.error("Erreur lors de la modification");
      } else {
        toast.success("Cotation modifiée");
        await loadData();
      }
    } else {
      // Créer une nouvelle cotation
      const { error } = await supabase.from("cotations").insert({
        id: crypto.randomUUID(),
        semaine_id: currentWeekId,
        date_jour: dateStr,
        agent_id: agentId,
        poste_id: posteId,
        modifie_manuellement: true,
      });

      if (error) {
        toast.error("Erreur lors de l'ajout");
      } else {
        toast.success("Cotation ajoutée");
        await loadData();
      }
    }

    setSaving(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const weekNavigation = () => {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium">
          {weekOffset === 0
            ? "Semaine en cours"
            : weekOffset < 0
              ? `Il y a ${-weekOffset} semaine${-weekOffset > 1 ? "s" : ""}`
              : `Dans ${weekOffset} semaine${weekOffset > 1 ? "s" : ""}`}
        </span>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="ml-2 text-sm text-blue-600 hover:underline"
          >
            Aujourd'hui
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
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
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${generating ? "animate-spin" : ""}`}
            />
            {generating ? "Génération..." : "Générer"}
          </button>
          <button
            onClick={handlePrint}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>

      {/* Tableau de cotation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50">
                Agents / Jours
              </th>
              {currentWeek.map((day, index) => {
                const isWeekend = day.getDay() === 6 || day.getDay() === 0;
                return (
                  <th key={index} className="p-4 text-center min-w-[120px]">
                    <div
                      className={`font-semibold ${isWeekend ? "text-red-600" : "text-gray-600"}`}
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
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-4 sticky left-0 bg-white border-r">
                    <div className="font-medium">
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
                    const isWeekend = day.getDay() === 6 || day.getDay() === 0;

                    return (
                      <td key={dayIndex} className="p-2 text-center">
                        {isIndisponible ? (
                          <div className="bg-red-50 text-red-500 p-2 rounded-lg text-sm">
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
                            className={`w-full p-2 rounded-lg border text-sm transition ${
                              currentPoste
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-gray-50 border-gray-200 text-gray-500"
                            } focus:ring-2 focus:ring-blue-500`}
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

      {/* Légende */}
      <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap items-center gap-6">
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

      {/* Message si tableau vide */}
      {cotations.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
          <p className="text-yellow-800">Aucune cotation pour cette semaine</p>
          <button
            onClick={handleGenerate}
            className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
          >
            Générer une cotation
          </button>
        </div>
      )}
    </div>
  );
}
