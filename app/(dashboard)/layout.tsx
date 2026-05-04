"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  History,
  Briefcase,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Postes", href: "/postes", icon: Briefcase },
  { name: "Cotation", href: "/cotations", icon: CalendarRange },
  { name: "Historique", href: "/historique", icon: History },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    getUserName();
  }, []);

  const getUserName = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: agent } = await supabase
        .from("agents")
        .select("nom, prenom")
        .eq("id", user.id)
        .single();

      if (agent) {
        setUserName(`${agent.prenom} ${agent.nom}`);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar mobile */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}
      >
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex flex-col w-72 bg-white h-full shadow-xl">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="font-semibold text-lg text-gray-900">Menu</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 -mr-2 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                    isActive
                      ? "bg-blue-50 text-blue-800"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-100">
          <div className="p-6 pb-4">
            <h1 className="text-xl font-bold text-blue-800">Garde Cotation</h1>
            <p className="text-sm text-gray-500 mt-1">{userName}</p>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                    isActive
                      ? "bg-blue-50 text-blue-800"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-100 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-red-600 hover:bg-red-50 transition font-medium"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold text-blue-800">Garde Cotation</h1>
            <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
