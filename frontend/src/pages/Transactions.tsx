import { useEffect, useState } from "react";
import api from "../api";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  date: string;
  category: Category;
  user: { name: string };
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "INCOME",
    amount: "",
    description: "",
    categoryId: "",
  });

  const loadData = async () => {
    const [t, c] = await Promise.all([
      api.get("/transactions"),
      api.get("/categories"),
    ]);
    setTransactions(t.data);
    setCategories(c.data);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("data-updated", loadData);
    return () => window.removeEventListener("data-updated", loadData);
  }, []);

  const handleSubmit = async () => {
    if (!form.amount || !form.categoryId) return;
    await api.post("/transactions", {
      ...form,
      amount: parseFloat(form.amount),
    });
    setForm({ type: "INCOME", amount: "", description: "", categoryId: "" });
    setShowForm(false);
    loadData();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Transacciones</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          + Nueva transacción
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-white font-bold mb-4">Nueva transacción</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Tipo</label>
              <div className={`px-4 py-3 rounded-lg text-white font-semibold ${form.type === "INCOME" ? "bg-green-700" : "bg-red-700"}`}>
                {form.type === "INCOME" ? "Ingreso" : "Egreso"} (según categoría)
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Monto</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Categoría</label>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  const selected = categories.find(c => c.id === e.target.value);
                  setForm({
                    ...form,
                    categoryId: e.target.value,
                    type: selected ? selected.type : form.type
                  });
                }}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type === "INCOME" ? "Ingreso" : "Egreso"})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Descripción</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
            >
              Guardar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {transactions.map((t) => (
          <div key={t.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-white font-semibold">{t.description || t.category.name}</p>
              <p className="text-gray-400 text-sm">
                {t.category.name} • {t.user.name} • {new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className={`text-xl font-bold ${t.type === "INCOME" ? "text-green-400" : "text-red-400"}`}>
                {t.type === "INCOME" ? "+" : "-"}Q{parseFloat(t.amount).toFixed(2)}
              </p>
              <button
                onClick={async () => {
                  if (!confirm("¿Eliminar esta transacción?")) return;
                  await api.delete(`/transactions/${t.id}`);
                  loadData();
                }}
                className="bg-red-700 hover:bg-red-800 text-white text-xs px-3 py-1 rounded-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}