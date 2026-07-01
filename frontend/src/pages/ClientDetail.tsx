import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { generateClientPDF } from "../utils/generatePDF";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [showModal, setShowModal] = useState<"INCOME" | "EXPENSE" | null>(null);
  const [transForm, setTransForm] = useState({ amount: "", description: "" });

  const loadClient = async () => {
    const res = await api.get(`/clients/${id}`);
    setSelectedClient(res.data);
  };

  useEffect(() => {
    loadClient();
    window.addEventListener("data-updated", loadClient);
    return () => window.removeEventListener("data-updated", loadClient);
  }, [id]);

  const handleAddTransaction = async () => {
    if (!transForm.amount || savingTransaction || !showModal) return;
    setSavingTransaction(true);

    const tempTransaction = {
      id: "temp-" + Date.now(),
      type: showModal,
      amount: transForm.amount,
      description: transForm.description,
      date: new Date().toISOString(),
      user: { name: "..." }
    };

    setSelectedClient((prev: any) => ({
      ...prev,
      transactions: [tempTransaction, ...prev.transactions],
      balance:
        showModal === "INCOME"
          ? prev.balance + parseFloat(transForm.amount)
          : prev.balance - parseFloat(transForm.amount)
    }));

    setShowModal(null);
    setTransForm({ amount: "", description: "" });

    try {
      await api.post(`/clients/${id}/transactions`, {
        type: showModal,
        amount: parseFloat(transForm.amount),
        description: transForm.description
      });
      loadClient();
    } catch (err) {
      alert("Error al guardar el movimiento");
      loadClient();
    } finally {
      setSavingTransaction(false);
    }
  };

  if (!selectedClient) return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 px-4 py-3 flex items-center shadow">
        <div className="w-16 h-6 bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="w-48 h-8 bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="w-24 h-4 bg-gray-700 rounded animate-pulse mb-4"></div>
          <div className="w-32 h-10 bg-gray-700 rounded animate-pulse ml-auto"></div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="w-40 h-6 bg-gray-700 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-12 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Navbar */}
      <div className="bg-gray-800 px-4 py-3 flex justify-between items-center shadow">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          ← Volver
        </button>
        <button
          onClick={() => generateClientPDF(selectedClient)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Exportar PDF
        </button>
      </div>

      <div className="p-6 max-w-3xl mx-auto">

        {/* Info cliente */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
              <p className="text-gray-400 text-sm">{selectedClient.type === "PERSON" ? "Persona" : "Empresa"}</p>
              {selectedClient.phone && <p className="text-gray-400 text-sm">📞 {selectedClient.phone}</p>}
              {selectedClient.email && <p className="text-gray-400 text-sm">✉️ {selectedClient.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Balance</p>
              <p className={`text-3xl font-bold ${selectedClient.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                Q{selectedClient.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => { setShowModal("INCOME"); setTransForm({ amount: "", description: "" }); }}
            className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition"
          >
            + Agregar abono
          </button>
          <button
            onClick={() => { setShowModal("EXPENSE"); setTransForm({ amount: "", description: "" }); }}
            className="bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition"
          >
            - Agregar cargo
          </button>
        </div>

        {/* Historial */}
        <h3 className="font-bold mb-3">Historial</h3>
        <div className="space-y-3">
          {selectedClient.transactions?.map((t: any) => (
            <div key={t.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white">{t.description || (t.type === "INCOME" ? "Abono" : "Cargo")}</p>
                <p className="text-gray-400 text-sm">
                  {t.user.name} • {new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className={`text-xl font-bold ${t.type === "INCOME" ? "text-green-400" : "text-red-400"}`}>
                  {t.type === "INCOME" ? "+" : "-"}Q{parseFloat(t.amount).toFixed(2)}
                </p>
                {!t.id.toString().startsWith("temp-") && (
                  <button
                    onClick={async () => {
                      if (!confirm("¿Eliminar este movimiento?")) return;
                      await api.delete(`/clients/${id}/transactions/${t.id}`);
                      loadClient();
                    }}
                    className="bg-red-700 hover:bg-red-800 text-white text-xs px-3 py-1 rounded-lg"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center z-50 pt-6 px-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className={`font-bold text-lg mb-4 ${showModal === "INCOME" ? "text-green-400" : "text-red-400"}`}>
              {showModal === "INCOME" ? "+ Agregar abono" : "- Agregar cargo"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Monto</label>
                <input
                  type="number"
                  value={transForm.amount}
                  onChange={(e) => setTransForm({ ...transForm, amount: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg text-lg"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Descripción (opcional)</label>
                <input
                  type="text"
                  value={transForm.description}
                  onChange={(e) => setTransForm({ ...transForm, description: e.target.value })}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
                  placeholder="Ej: Pago de deuda"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddTransaction}
                disabled={savingTransaction}
                className={`flex-1 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50 ${
                  showModal === "INCOME" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {savingTransaction ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}