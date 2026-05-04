# 📋 Gestion des Cotations - Service de Garde

## 🎯 Qu'est-ce que cette application ?

Cette application aide les chefs de service (douane, police, hôpital, administration...) à organiser les gardes de leur équipe facilement et équitablement.

**En clair :** Plus besoin de tableau Excel ou de papier. L'application génère automatiquement le planning des gardes pour la semaine, que vous pouvez modifier en 2 clics.

---

## 👥 Pour qui ?

| Utilisateur         | Besoin                                                         |
| ------------------- | -------------------------------------------------------------- |
| **Chef de service** | Organiser les gardes rapidement, assurer l'équité entre agents |
| **Agent**           | Voir son planning, savoir quand il travaille                   |
| **Administrateur**  | Gérer la liste des agents et des postes                        |

---

## ✨ Ce que l'application fait

| Fonction                  | À quoi ça sert                                     |
| ------------------------- | -------------------------------------------------- |
| **Gestion des agents**    | Ajouter, modifier, supprimer des agents            |
| **Indisponibilités**      | Marquer un agent malade, en mission, en congé      |
| **Postes de garde**       | Définir les postes (Matin, Soir, Nuit, Accueil...) |
| **Génération auto**       | Crée un planning équitable en 1 clic               |
| **Modification manuelle** | Ajuster le planning à la main si besoin            |
| **Historique**            | Consulter les anciens plannings                    |
| **Export/Impression**     | Imprimer ou sauvegarder en PDF                     |

---

## 📅 Comment ça marche ?

### Une semaine type

1. **Lundi** → Je clique sur "Générer" pour la semaine prochaine
2. **Mardi → Dimanche** → Je peux modifier si quelqu'un est absent
3. **Vendredi** → J'imprime ou j'envoie le planning à l'équipe
4. **Mardi suivant** → Le planning s'applique en vrai

### Ce que fait l'algorithme automatiquement

- Répartit équitablement les gardes entre tous les agents
- Ignore les agents indisponibles (malade, formation...)
- Évite qu'un agent fasse deux nuits de suite
- Priorise ceux qui ont le moins travaillé

---

## 🖥️ Les écrans principaux

### Tableau de bord

→ Vue d'ensemble : combien d'agents, combien de semaines enregistrées

### Agents

→ Liste de tous les agents
→ Ajouter/supprimer
→ Marquer indisponible avec dates

### Postes

→ Définir les postes de votre service (ex: "Porte A", "Patrouille", "Nuit")

### Cotation

→ Le planning hebdomadaire (mardi → lundi)
→ Tableau : lignes = agents, colonnes = jours
→ Chaque cellule = poste assigné (modifiable)

### Historique

→ Tous les plannings des semaines passées
→ Consultation uniquement (ou reprise d'une semaine)

---

## 📖 Exemple concret

**Service de 5 agents, 3 postes par jour**

Semaine du mardi 5 au lundi 11 mai :

| Agent  | Mardi | Mercredi | Jeudi | Vendredi | Samedi | Dimanche | Lundi |
| ------ | ----- | -------- | ----- | -------- | ------ | -------- | ----- |
| Dupont | Matin | Soir     | Nuit  | Repos    | Matin  | Soir     | Nuit  |
| Martin | Soir  | Nuit     | Repos | Matin    | Soir   | Nuit     | Repos |
| Durand | Nuit  | Repos    | Matin | Soir     | Nuit   | Repos    | Matin |

✅ Chaque agent fait 5 gardes sur 7  
✅ Les postes sont équitablement répartis  
✅ Personne n'a deux nuits consécutives

---

## 🔄 Cas d'utilisation fréquents

| Situation                     | Solution                                   |
| ----------------------------- | ------------------------------------------ |
| Nouvel agent arrive           | Menu Agents → Ajouter                      |
| Agent en congés               | Menu Agents → Indisponible (choisir dates) |
| Planning pas équitable        | Bouton "Générer" (écrase l'ancien)         |
| Échange de garde entre agents | Modifier manuellement dans le tableau      |
| Voir le mois dernier          | Menu Historique                            |

---

## 🎨 À quoi ressemble l'interface ?

- **Boutons colorés** : Bleu = action principale, Vert = générer, Rouge = supprimer
- **Tableau clair** : Les weekends en rouge, les indisponibles en gris
- **Navigation simple** : Menu à gauche, flèches ← → pour changer de semaine
- **Responsive** : Fonctionne sur tablette et ordinateur

---

## 📝 Lexique

| Terme                | Définition                                                  |
| -------------------- | ----------------------------------------------------------- |
| **Cotation**         | Le planning qui assigne chaque agent à un poste chaque jour |
| **Poste**            | Un type de garde (ex: Matin, Soir, Nuit, Accueil)           |
| **Agent**            | Une personne qui fait des gardes                            |
| **Indisponibilité**  | Période où l'agent ne peut pas travailler                   |
| **Semaine de garde** | Du mardi au lundi (spécifique à certains services)          |

---

## 💡 Astuces

- **Générez toujours une semaine à l'avance** → Vous avez le temps d'ajuster
- **Marquez les indisponibilités immédiatement** → L'algorithme les prend en compte
- **Utilisez l'impression** → Le tableau s'imprime proprement sur une page
- **L'historique est automatique** → Pas besoin de sauvegarder vous-même

---

## ❓ Questions fréquentes

**Que faire si l'algorithme fait une erreur ?**  
Modifiez manuellement la cellule concernée, c'est fait pour ça.

**Puis-je reprendre un planning d'il y a 3 semaines ?**  
Oui, allez dans Historique → "Reprendre cette semaine"

**Plusieurs personnes peuvent-elles utiliser l'app en même temps ?**  
Oui, les changements sont visibles en temps réel.

**Les données sont-elles perdues si je ferme ?**  
Non, tout est sauvegardé automatiquement.

---

## 🚀 Bénéfices par rapport à Excel

| Excel                            | Cette application              |
| -------------------------------- | ------------------------------ |
| À faire à la main chaque semaine | Généré en 1 clic               |
| Risque d'erreur de calcul        | Algorithme équitable           |
| Pas d'historique automatique     | Tout est gardé                 |
| Pas de vue indisponibilités      | Cases à cocher simples         |
| Feuilles qui se perdent          | Centralisé, accessible partout |

---

## 📞 Support

Pour toute question ou suggestion : contactez l'administrateur de l'application.

---

_Version 1.0 - Application de gestion des cotations pour services de garde_

```

```
