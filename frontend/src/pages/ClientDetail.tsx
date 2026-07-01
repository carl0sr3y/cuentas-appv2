import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { generateClientPDF } from "../utils/generatePDF";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [transForm, setTransForm] = useState({ type: "INCOME", amount: "", description: "" });
  const [savingTransaction, setSavingTransaction] = useState(false);

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
    if (!transForm.amount || savingTransaction) return;
    setSavingTransaction(true);

    const tempTransaction = {
      id: "temp-" + Date.now(),
      type: transForm.type,
      amount: transForm.amount,
      description: transForm.description,
      date: new Date().toISOString(),
      user: { name: "..." }
    };

    setSelectedClient((prev: any) => ({
      ...prev,
      transactions: [tempTransaction, ...prev.transactions],
      balance:
        transForm.type === "INCOME"
          ? prev.balance + parseFloat(transForm.amount)
          : prev.balance - parseFloat(transForm.amount)
    }));

    setTransForm({ type: "INCOME", amount: "", description: "" });

    try {
      await api.post(`/clients/${id}/transactions`, {
        ...transForm,
        amount: parseFloat(transForm.amount)
      });
      loadClient();
    } catch (err) {
      alert("Error al guardar el movimiento");
      loadClient();
    } finally {
      setSavingTransaction(false);
    }
  };

  if (!selectedClient) return <div className="p-6 text-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="font-bold mb-4">Agregar movimiento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={transForm.type}
              onChange={(e) => setTransForm({ ...transForm, type: e.target.value })}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg"
            >
              <option value="INCOME">Entrada (abono)</option>
              <option value="EXPENSE">Salida (cargo)</option>
            </select>
            <input
              type="number"
              value={transForm.amount}
              onChange={(e) => setTransForm({ ...transForm, amount: e.target.value })}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg"
              placeholder="Monto"
            />
            <input
              type="text"
              value={transForm.description}
              onChange={(e) => setTransForm({ ...transForm, description: e.target.value })}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg"
              placeholder="Descripción (opcional)"
            />
          </div>
          <button
            onClick={handleAddTransaction}
            disabled={savingTransaction}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            {savingTransaction ? "Guardando..." : "Agregar"}
          </button>
        </div>

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
    </div>
  );
}