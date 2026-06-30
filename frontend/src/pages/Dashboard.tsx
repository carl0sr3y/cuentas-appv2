import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import Transactions from "./Transactions";
import Categories from "./Categories";
import Clients from "./Clients";
import { generatePDF } from "../utils/generatePDF";

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, { total: number; type: string }>;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("resumen");
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout, notifications } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/reports/summary").then((res) => setSummary(res.data));
    api.get("/transactions").then((res) => setTransactions(res.data));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const tabs = ["resumen", "transacciones", "categorias", "clientes"];

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Navbar */}
      <div className="bg-gray-800 px-4 py-3 flex justify-between items-center shadow">
        <h1 className="text-lg font-bold text-blue-400 whitespace-nowrap">Cuentas App</h1>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-gray-300 text-xs hidden sm:block">{user?.name} — {user?.role}</span>

          {/* Notificaciones */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg"
            >
              🔔
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-xl shadow-xl z-50 p-4">
                <h3 className="text-white font-bold mb-3">Notificaciones</h3>
                {notifications.length === 0 ? (
                  <p className="text-gray-400 text-sm">Sin notificaciones</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n, i) => (
                      <div key={i} className="bg-gray-700 rounded-lg p-3">
                        <p className="text-white text-sm">{n.message}</p>
                        <p className="text-gray-400 text-xs mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => summary && generatePDF(summary, transactions)}
            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg"
          >
            PDF
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded-lg"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border-t border-gray-700 overflow-x-auto">
        <div className="flex min-w-max px-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-semibold capitalize transition border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {activeTab === "resumen" && (
        <div className="p-4 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Resumen financiero</h2>
          {summary ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-800 rounded-xl p-6">
                  <p className="text-green-300 text-sm mb-1">Total Ingresos</p>
                  <p className="text-3xl font-bold">Q{summary.totalIncome.toFixed(2)}</p>
                </div>
                <div className="bg-red-800 rounded-xl p-6">
                  <p className="text-red-300 text-sm mb-1">Total Egresos</p>
                  <p className="text-3xl font-bold">Q{summary.totalExpense.toFixed(2)}</p>
                </div>
                <div className="bg-blue-800 rounded-xl p-6">
                  <p className="text-blue-300 text-sm mb-1">Balance</p>
                  <p className="text-3xl font-bold">Q{summary.balance.toFixed(2)}</p>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Por categoría</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(summary.byCategory).map(([name, data]) => (
                  <div key={name} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{name}</p>
                      <p className="text-sm text-gray-400">{data.type === "INCOME" ? "Ingreso" : "Egreso"}</p>
                    </div>
                    <p className="text-xl font-bold text-green-400">Q{data.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400">Cargando...</p>
          )}
        </div>
      )}

      {activeTab === "transacciones" && <Transactions />}
      {activeTab === "categorias" && <Categories />}
      {activeTab === "clientes" && <Clients />}
    </div>
  );
}