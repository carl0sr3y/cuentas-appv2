import { useEffect, useState } from "react";
import api from "../api";
import { generateClientPDF } from "../utils/generatePDF";

interface Client {
    id: string;
    name: string;
    type: string;
    phone?: string;
    email?: string;
    isFavorite: boolean;
    balance: number;
    transactions?: any[];
}

export default function Clients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [form, setForm] = useState({ name: "", type: "PERSON", phone: "", email: "" });
    const [transForm, setTransForm] = useState({ type: "INCOME", amount: "", description: "" });
    const [saving, setSaving] = useState(false);
    const [savingTransaction, setSavingTransaction] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);

    const loadClients = async () => {
        const res = await api.get("/clients");
        setClients(res.data);
    };

    useEffect(() => {
        loadClients();
        window.addEventListener("data-updated", loadClients);
        return () => window.removeEventListener("data-updated", loadClients);
    }, []);

    const handleCreateClient = async () => {
        if (!form.name || saving) return;
        setSaving(true);

        const tempClient: Client = {
            id: "temp-" + Date.now(),
            ...form,
            isFavorite: false,
            balance: 0,
            transactions: []
        };

        setClients((prev) => [...prev, tempClient]);
        setForm({ name: "", type: "PERSON", phone: "", email: "" });
        setShowForm(false);

        try {
            await api.post("/clients", tempClient);
            loadClients();
        } catch (err) {
            setClients((prev) => prev.filter((c) => c.id !== tempClient.id));
            alert("Error al guardar el cliente");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`¿Eliminar ${selectedToDelete.length} cliente(s)?`)) return;
        for (const id of selectedToDelete) {
            await api.delete(`/clients/${id}`);
        }
        setSelectedToDelete([]);
        setDeleteMode(false);
        loadClients();
    };

    const toggleSelectClient = (id: string) => {
        setSelectedToDelete((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleToggleFavorite = async (id: string) => {
        await api.patch(`/clients/${id}/favorite`, {});
        loadClients();
    };

    const handleOpenClient = async (id: string) => {
        const basicClient = clients.find((c) => c.id === id);
        if (basicClient) {
            setSelectedClient({ ...basicClient, transactions: [] });
        }
        const res = await api.get(`/clients/${id}`);
        setSelectedClient(res.data);
    };

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
            await api.post(`/clients/${selectedClient.id}/transactions`, {
                ...transForm,
                amount: parseFloat(transForm.amount)
            });
            handleOpenClient(selectedClient.id);
        } catch (err) {
            alert("Error al guardar el movimiento");
            handleOpenClient(selectedClient.id);
        } finally {
            setSavingTransaction(false);
        }
    };

    const favorites = clients.filter((c) => c.isFavorite);
    const nonFavorites = clients.filter((c) => !c.isFavorite);
    const grouped = nonFavorites.reduce((acc: Record<string, Client[]>, c) => {
        const letter = c.name[0].toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(c);
        return acc;
    }, {});

    if (selectedClient) {
        return (
            <div className="p-6 max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => setSelectedClient(null)}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                    >
                        ← Volver
                    </button>
                    <button
                        onClick={() => generateClientPDF(selectedClient)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm"
                    >
                        Exportar PDF
                    </button>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedClient.name}</h2>
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
                    <h3 className="text-white font-bold mb-4">Agregar movimiento</h3>
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

                <h3 className="text-white font-bold mb-3">Historial</h3>
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
                                {!t.id.startsWith("temp-") && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm("¿Eliminar este movimiento?")) return;
                                            await api.delete(`/clients/${selectedClient.id}/transactions/${t.id}`);
                                            handleOpenClient(selectedClient.id);
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
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Clientes</h2>
                <div className="flex gap-2">
                    {deleteMode ? (
                        <>
                            <button
                                onClick={handleDeleteSelected}
                                disabled={selectedToDelete.length === 0}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-30"
                            >
                                Eliminar ({selectedToDelete.length})
                            </button>
                            <button
                                onClick={() => { setDeleteMode(false); setSelectedToDelete([]); }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setDeleteMode(true)}
                                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg transition"
                            >
                                Eliminar
                            </button>
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                            >
                                + Nuevo cliente
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Popup nuevo cliente */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center z-50 pt-10 px-4">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-white font-bold mb-4">Nuevo cliente</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-300 text-sm mb-1 block">Nombre</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
                                    placeholder="Nombre completo o empresa"
                                />
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm mb-1 block">Tipo</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
                                >
                                    <option value="PERSON">Persona</option>
                                    <option value="COMPANY">Empresa</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm mb-1 block">Teléfono</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
                                    placeholder="Opcional"
                                />
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm mb-1 block">Email</label>
                                <input
                                    type="text"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCreateClient}
                                disabled={saving}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50 flex-1"
                            >
                                {saving ? "Guardando..." : "Guardar"}
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition flex-1"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {favorites.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-yellow-400 font-bold mb-3">⭐ Favoritos</h3>
                    <div className="space-y-3">
                        {favorites.map((c) => (
                            <ClientRow
                                key={c.id}
                                client={c}
                                onOpen={handleOpenClient}
                                onFavorite={handleToggleFavorite}
                                deleteMode={deleteMode}
                                selected={selectedToDelete.includes(c.id)}
                                onSelect={toggleSelectClient}
                            />
                        ))}
                    </div>
                </div>
            )}

            {Object.keys(grouped).sort().map((letter) => (
                <div key={letter} className="mb-6">
                    <h3 className="text-gray-400 font-bold mb-3 border-b border-gray-700 pb-1">{letter}</h3>
                    <div className="space-y-3">
                        {grouped[letter].map((c) => (
                            <ClientRow
                                key={c.id}
                                client={c}
                                onOpen={handleOpenClient}
                                onFavorite={handleToggleFavorite}
                                deleteMode={deleteMode}
                                selected={selectedToDelete.includes(c.id)}
                                onSelect={toggleSelectClient}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function ClientRow({ client, onOpen, onFavorite, deleteMode, selected, onSelect }: {
    client: Client;
    onOpen: (id: string) => void;
    onFavorite: (id: string) => void;
    deleteMode: boolean;
    selected: boolean;
    onSelect: (id: string) => void;
}) {
    return (
        <div
            className={`rounded-xl p-4 flex justify-between items-center cursor-pointer transition ${selected ? "bg-red-900 border border-red-500" : "bg-gray-800"
                }`}
            onClick={() => deleteMode ? onSelect(client.id) : onOpen(client.id)}
        >
            <div className="flex items-center gap-3">
                {deleteMode && (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected ? "bg-red-500 border-red-500" : "border-gray-500"
                        }`}>
                        {selected && <span className="text-white text-xs">✓</span>}
                    </div>
                )}
                <div>
                    <p className="text-white font-semibold">{client.name}</p>
                    <p className="text-gray-400 text-sm">{client.type === "PERSON" ? "Persona" : "Empresa"}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <p className={`text-lg font-bold ${client.balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                    Q{client.balance.toFixed(2)}
                </p>
                {!deleteMode && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onFavorite(client.id); }}
                        className="text-xl hover:scale-125 transition"
                    >
                        {client.isFavorite ? "⭐" : "☆"}
                    </button>
                )}
            </div>
        </div>
    );
}