"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Users, Plus, Edit, Trash2, X, Check, CalendarOff } from "lucide-react";

interface Agent {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  actif: boolean;
}

interface Indisponibilite {
  id: string;
  agent_id: string;
  date_debut: string;
  date_fin: string;
  raison: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [indisponibilites, setIndisponibilites] = useState<Indisponibilite[]>(
    [],
  );
  const [showModal, setShowModal] = useState(false);
  const [showIndispoModal, setShowIndispoModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
  });
  const [indispoData, setIndispoData] = useState({
    date_debut: "",
    date_fin: "",
    raison: "",
  });

  const supabase = createClient();

  useEffect(() => {
    loadAgents();
    loadIndisponibilites();
  }, []);

  const loadAgents = async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("nom", { ascending: true });

    if (error) {
      toast.error("Erreur lors du chargement des agents");
    } else {
      setAgents(data || []);
    }
  };

  const loadIndisponibilites = async () => {
    const { data, error } = await supabase
      .from("indisponibilites")
      .select("*")
      .gte("date_fin", new Date().toISOString().split("T")[0]);

    if (!error && data) {
      setIndisponibilites(data);
    }
  };

  const isAgentIndisponible = (agentId: string): boolean => {
    const today = new Date().toISOString().split("T")[0];
    return indisponibilites.some(
      (indispo) =>
        indispo.agent_id === agentId &&
        indispo.date_debut <= today &&
        indispo.date_fin >= today,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingAgent) {
      const { error } = await supabase
        .from("agents")
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
        })
        .eq("id", editingAgent.id);

      if (error) {
        toast.error("Erreur lors de la modification");
      } else {
        toast.success("Agent modifié avec succès");
        loadAgents();
        closeModal();
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("agents")
        .insert([{ ...formData, id: user?.id, actif: true }]);

      if (error) {
        toast.error("Erreur lors de l'ajout");
      } else {
        toast.success("Agent ajouté avec succès");
        loadAgents();
        closeModal();
      }
    }
    setLoading(false);
  };

  const handleDelete = async (agent: Agent) => {
    toast.custom(
      (t) => (
        <div
          className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex items-center justify-between p-4 gap-4`}
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              Supprimer {agent.prenom} {agent.nom} ?
            </p>
            <p className="text-xs text-gray-500">
              Cette action est irréversible
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const { error } = await supabase
                  .from("agents")
                  .update({ actif: false })
                  .eq("id", agent.id);
                if (error) {
                  toast.error("Erreur lors de la suppression");
                } else {
                  toast.success("Agent supprimé");
                  loadAgents();
                }
              }}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      ),
      { duration: 5000 },
    );
  };

  const handleAddIndisponibilite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    const { error } = await supabase.from("indisponibilites").insert([
      {
        agent_id: selectedAgent.id,
        date_debut: indispoData.date_debut,
        date_fin: indispoData.date_fin,
        raison: indispoData.raison,
      },
    ]);

    if (error) {
      toast.error("Erreur lors de l'ajout d'indisponibilité");
    } else {
      toast.success("Indisponibilité ajoutée");
      loadIndisponibilites();
      setShowIndispoModal(false);
      setIndispoData({ date_debut: "", date_fin: "", raison: "" });
    }
  };

  const handleRemoveIndisponibilite = async (
    indispoId: string,
    agentName: string,
  ) => {
    toast.custom(
      (t) => (
        <div
          className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex items-center justify-between p-4 gap-4`}
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              Supprimer cette indisponibilité ?
            </p>
            <p className="text-xs text-gray-500">Pour {agentName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const { error } = await supabase
                  .from("indisponibilites")
                  .delete()
                  .eq("id", indispoId);
                if (error) {
                  toast.error("Erreur lors de la suppression");
                } else {
                  toast.success("Indisponibilité supprimée");
                  loadIndisponibilites();
                }
              }}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      ),
      { duration: 5000 },
    );
  };

  const openModal = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({ nom: agent.nom, prenom: agent.prenom, email: agent.email });
    } else {
      setEditingAgent(null);
      setFormData({ nom: "", prenom: "", email: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAgent(null);
    setFormData({ nom: "", prenom: "", email: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des agents
          </h1>
          <p className="text-gray-500 mt-1">
            Ajoutez, modifiez ou désactivez des agents
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-700 text-white px-4 py-2.5 rounded-xl hover:bg-blue-800 transition flex items-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Ajouter un agent
        </button>
      </div>

      {/* Liste des agents */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Nom
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Prénom
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Email
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Statut
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {agents
                .filter((a) => a.actif)
                .map((agent) => {
                  const indisponible = isAgentIndisponible(agent.id);
                  return (
                    <tr
                      key={agent.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                    >
                      <td className="p-4 font-medium text-gray-900">
                        {agent.nom}
                      </td>
                      <td className="p-4 text-gray-700">{agent.prenom}</td>
                      <td className="p-4 text-gray-500">{agent.email}</td>
                      <td className="p-4">
                        {indisponible ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <CalendarOff className="w-3 h-3" />
                            Indisponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <Check className="w-3 h-3" />
                            Disponible
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(agent)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setShowIndispoModal(true);
                            }}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          >
                            <CalendarOff className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(agent)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {agents.filter((a) => a.actif).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Aucun agent actif
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout/Modification Agent */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAgent ? "Modifier l'agent" : "Ajouter un agent"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) =>
                    setFormData({ ...formData, prenom: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-700 text-white py-2.5 rounded-xl hover:bg-blue-800 transition font-medium"
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Indisponibilité */}
      {showIndispoModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                Indisponibilité - {selectedAgent.prenom} {selectedAgent.nom}
              </h2>
              <button
                onClick={() => setShowIndispoModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Indisponibilités existantes */}
            {indisponibilites.filter((i) => i.agent_id === selectedAgent.id)
              .length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium mb-2">
                  Indisponibilités en cours :
                </p>
                {indisponibilites
                  .filter((i) => i.agent_id === selectedAgent.id)
                  .map((indispo) => (
                    <div
                      key={indispo.id}
                      className="flex justify-between items-center text-sm py-1"
                    >
                      <span className="text-gray-600">
                        {indispo.date_debut} → {indispo.date_fin}
                        {indispo.raison && ` (${indispo.raison})`}
                      </span>
                      <button
                        onClick={() =>
                          handleRemoveIndisponibilite(
                            indispo.id,
                            `${selectedAgent.prenom} ${selectedAgent.nom}`,
                          )
                        }
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <form onSubmit={handleAddIndisponibilite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date début
                </label>
                <input
                  type="date"
                  value={indispoData.date_debut}
                  onChange={(e) =>
                    setIndispoData({
                      ...indispoData,
                      date_debut: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={indispoData.date_fin}
                  onChange={(e) =>
                    setIndispoData({ ...indispoData, date_fin: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison (optionnel)
                </label>
                <select
                  value={indispoData.raison}
                  onChange={(e) =>
                    setIndispoData({ ...indispoData, raison: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-900"
                >
                  <option value="">Sélectionner une raison</option>
                  <option value="malade">Malade</option>
                  <option value="mission">En mission</option>
                  <option value="absence">Absence</option>
                  <option value="formation">Formation</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowIndispoModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2.5 rounded-xl hover:bg-orange-700 transition font-medium"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
