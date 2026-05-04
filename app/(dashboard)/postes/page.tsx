"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  X,
  MoveUp,
  MoveDown,
} from "lucide-react";

interface Poste {
  id: string;
  nom: string;
  ordre: number;
}

export default function PostesPage() {
  const [postes, setPostes] = useState<Poste[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPoste, setEditingPoste] = useState<Poste | null>(null);
  const [nomPoste, setNomPoste] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadPostes();
  }, []);

  const loadPostes = async () => {
    const { data, error } = await supabase
      .from("postes")
      .select("*")
      .order("ordre", { ascending: true });

    if (error) {
      toast.error("Erreur lors du chargement des postes");
    } else {
      setPostes(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingPoste) {
      const { error } = await supabase
        .from("postes")
        .update({ nom: nomPoste })
        .eq("id", editingPoste.id);

      if (error) {
        toast.error("Erreur lors de la modification");
      } else {
        toast.success("Poste modifié");
        loadPostes();
        closeModal();
      }
    } else {
      const newOrdre = postes.length + 1;
      const { error } = await supabase
        .from("postes")
        .insert([{ nom: nomPoste, ordre: newOrdre }]);

      if (error) {
        toast.error("Erreur lors de l'ajout");
      } else {
        toast.success("Poste ajouté");
        loadPostes();
        closeModal();
      }
    }
    setLoading(false);
  };

  const handleDelete = async (poste: Poste) => {
    toast.custom(
      (t) => (
        <div
          className={`${t.visible ? "animate-enter" : "animate-leave"} max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex items-center justify-between p-4 gap-4`}
        >
          <div>
            <p className="text-sm font-medium text-gray-900">
              Supprimer le poste "{poste.nom}" ?
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
                  .from("postes")
                  .delete()
                  .eq("id", poste.id);
                if (error) {
                  toast.error("Erreur lors de la suppression");
                } else {
                  toast.success("Poste supprimé");
                  loadPostes();
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

  const handleMove = async (poste: Poste, direction: "up" | "down") => {
    const currentIndex = postes.findIndex((p) => p.id === poste.id);
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= postes.length) return;

    const targetPoste = postes[targetIndex];

    const { error: error1 } = await supabase
      .from("postes")
      .update({ ordre: targetPoste.ordre })
      .eq("id", poste.id);

    const { error: error2 } = await supabase
      .from("postes")
      .update({ ordre: poste.ordre })
      .eq("id", targetPoste.id);

    if (error1 || error2) {
      toast.error("Erreur lors du déplacement");
    } else {
      toast.success("Ordre mis à jour");
      loadPostes();
    }
  };

  const openModal = (poste?: Poste) => {
    if (poste) {
      setEditingPoste(poste);
      setNomPoste(poste.nom);
    } else {
      setEditingPoste(null);
      setNomPoste("");
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPoste(null);
    setNomPoste("");
  };

  const posteColors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-indigo-100 text-indigo-700",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Postes de garde</h1>
          <p className="text-gray-500 mt-1">
            Définissez les différents postes de garde
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-700 text-white px-4 py-2.5 rounded-xl hover:bg-blue-800 transition flex items-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Ajouter un poste
        </button>
      </div>

      {/* Liste des postes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {postes.map((poste, index) => (
          <div
            key={poste.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`p-2.5 rounded-xl ${posteColors[index % posteColors.length]}`}
              >
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleMove(poste, "up")}
                  disabled={index === 0}
                  className={`p-1.5 rounded-lg transition ${index === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  <MoveUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMove(poste, "down")}
                  disabled={index === postes.length - 1}
                  className={`p-1.5 rounded-lg transition ${index === postes.length - 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-100"}`}
                >
                  <MoveDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openModal(poste)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(poste)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-lg text-gray-900">{poste.nom}</h3>
            <p className="text-sm text-gray-400 mt-1">Ordre: {poste.ordre}</p>
          </div>
        ))}
      </div>

      {/* Message si aucun poste */}
      {postes.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun poste défini</p>
          <button
            onClick={() => openModal()}
            className="mt-3 text-blue-700 font-medium hover:underline"
          >
            Ajouter votre premier poste
          </button>
        </div>
      )}

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPoste ? "Modifier le poste" : "Ajouter un poste"}
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
                  Nom du poste
                </label>
                <input
                  type="text"
                  value={nomPoste}
                  onChange={(e) => setNomPoste(e.target.value)}
                  placeholder="Ex: Matin, Soir, Nuit..."
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
    </div>
  );
}
