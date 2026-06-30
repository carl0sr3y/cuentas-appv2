import { useEffect, useState } from "react";
import api from "../api";

interface Category {
  id: string;
  name: string;
  type: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "INCOME" });

  const loadCategories = async () => {
    const res = await api.get("/categories");
    setCategories(res.data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async () => {
    if (!form.name) return;
    await api.post("/categories", form);
    setForm({ name: "", type: "INCOME" });
    setShowForm(false);
    loadCategories();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Categorías</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          + Nueva categoría
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-white font-bold mb-4">Nueva categoría</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
                placeholder="Ej: Ventas, Alquiler..."
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
              >
                <option value="INCOME">Ingreso</option>
                <option value="EXPENSE">Egreso</option>
              </select>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-gray-800 rounded-xl p-4 flex justify-between items-center">
            <p className="text-white font-semibold">{c.name}</p>
            <span className={`text-sm px-3 py-1 rounded-full ${
              c.type === "INCOME"
                ? "bg-green-900 text-green-300"
                : "bg-red-900 text-red-300"
            }`}>
              {c.type === "INCOME" ? "Ingreso" : "Egreso"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}