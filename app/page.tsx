/**
 * UpFlow - Feature Request Management Demo
 * Theme: Dark charcoal with electric cyan and coral accents
 * 
 * This is a demo mockup. Features are simulated for presentation purposes.
 * Shows a developer tool for collecting and managing feature requests with community voting.
 */

"use client";

import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import FeatureList from "./components/FeatureList";
import CreateFeatureModal from "./components/CreateFeatureModal";

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: "planned" | "in-progress" | "completed" | "under-review";
  category: string;
  votes: number;
  comments: number;
  author: string;
  date: string;
  userVote: "up" | "down" | null;
}

const initialFeatures: Feature[] = [
  {
    id: "1",
    title: "Mode sombre",
    description: "Ajouter un bouton pour basculer entre les thèmes clair et sombre dans toute l’application.",
    status: "in-progress",
    category: "UI/UX",
    votes: 124,
    comments: 18,
    author: "Sarah Chen",
    date: "2024-01-15",
    userVote: null,
  },
  {
    id: "2",
    title: "Raccourcis clavier",
    description: "Implémenter des raccourcis clavier personnalisables pour les actions courantes afin d’améliorer la productivité.",
    status: "planned",
    category: "Productivité",
    votes: 89,
    comments: 12,
    author: "Mike Johnson",
    date: "2024-01-18",
    userVote: null,
  },
  {
    id: "3",
    title: "Exporter en CSV",
    description: "Permettre aux utilisateurs d’exporter toutes les demandes de fonctionnalités et les données de vote au format CSV pour une analyse externe.",
    status: "completed",
    category: "Intégration",
    votes: 156,
    comments: 24,
    author: "Emma Williams",
    date: "2024-01-10",
    userVote: null,
  },
  {
    id: "4",
    title: "Notifications par e-mail",
    description: "Envoyer des alertes par e-mail lorsque les fonctionnalités changent de statut ou reçoivent de nouveaux commentaires.",
    status: "under-review",
    category: "Notifications",
    votes: 67,
    comments: 9,
    author: "Alex Rodriguez",
    date: "2024-01-20",
    userVote: null,
  },
  {
    id: "5",
    title: "Application mobile",
    description: "Créer des applications natives iOS et Android pour gérer les demandes de fonctionnalités en déplacement.",
    status: "planned",
    category: "Plateforme",
    votes: 203,
    comments: 45,
    author: "James Lee",
    date: "2024-01-12",
    userVote: null,
  },
  {
    id: "6",
    title: "Filtrage avancé",
    description: "Ajouter davantage d’options de filtres (plage de dates, nombre de votes, tags personnalisés, etc.).",
    status: "in-progress",
    category: "Fonctionnalités",
    votes: 92,
    comments: 15,
    author: "Lisa Park",
    date: "2024-01-19",
    userVote: null,
  },
  {
    id: "7",
    title: "Webhooks API",
    description: "Déclencher des webhooks lorsque certains événements surviennent (nouvelle fonctionnalité, changement de statut, etc.).",
    status: "planned",
    category: "Intégration",
    votes: 78,
    comments: 11,
    author: "David Kim",
    date: "2024-01-17",
    userVote: null,
  },
  {
    id: "8",
    title: "Support Markdown dans les descriptions",
    description: "Permettre la mise en forme de texte enrichi dans les descriptions de fonctionnalités via la syntaxe Markdown.",
    status: "completed",
    category: "Fonctionnalités",
    votes: 134,
    comments: 22,
    author: "Rachel Green",
    date: "2024-01-08",
    userVote: null,
  },
];

export default function Home() {
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");

  const voteValue = (vote: Feature["userVote"]) => {
    if (vote === "up") return 1;
    if (vote === "down") return -1;
    return 0;
  };

  const handleVote = (featureId: string, voteType: "up" | "down") => {
    setFeatures((prev) =>
      prev.map((feature) => {
        if (feature.id !== featureId) return feature;

        const currentVote = feature.userVote;
        if (currentVote === null) {
          return { ...feature, votes: feature.votes + voteValue(voteType), userVote: voteType };
        }

        return { ...feature, votes: feature.votes - voteValue(currentVote), userVote: null };
      })
    );
  };

  const handleCreateFeature = (newFeature: Omit<Feature, "id" | "votes" | "comments" | "date" | "userVote">) => {
    const feature: Feature = {
      ...newFeature,
      id: Date.now().toString(),
      votes: 1,
      comments: 0,
      date: new Date().toISOString().split("T")[0],
      userVote: "up",
    };
    setFeatures((prev) => [feature, ...prev]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <Navbar onCreateClick={() => setIsCreateModalOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          features={features}
        />
        
        <FeatureList
          features={features}
          selectedFilter={selectedFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onVote={handleVote}
        />
      </div>

      {isCreateModalOpen && (
        <CreateFeatureModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateFeature}
        />
      )}
    </div>
  );
}
