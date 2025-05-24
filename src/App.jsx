import React, { useEffect, useState } from "react";
import "./index.css";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

const horarios = Array.from({ length: 19 }, (_, i) => {
  const hora = 8 + Math.floor(i / 2);
  const minuto = i % 2 === 0 ? "00" : "30";
  return `${hora.toString().padStart(2, "0")}:${minuto}`;
});

export default function App() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split("T")[0]);
  const [agendamentos, setAgendamentos] = useState({});
  const [modalInfo, setModalInfo] = useState({ visible: false, horario: "" });
  const [form, setForm] = useState({ animal: "", tutor: "", servico: [], profissional: "" });
  const profissionais = ["Silvia", "Taty", "Italo", "Marcelo", "Marcos", "Eliene", "Francisco", "Raimundo", "Vera"];
  const servicosDisponiveis = ["Banho", "Tosa", "Tosa Higienica", "Hidratação", "Remoção"];

  useEffect(() => {
    const fetchAgendamentos = async () => {
      const querySnapshot = await getDocs(collection(db, "agendamentos", dataSelecionada, "horarios"));
      const data = {};
      querySnapshot.forEach((doc) => {
        data[doc.id] = doc.data();
      });
      setAgendamentos(data);
    };
    fetchAgendamentos();
  }, [dataSelecionada]);

  const abrirModal = (horario) => {
    const agendamento = agendamentos[horario] || { animal: "", tutor: "", servico: [], profissional: "" };
    setForm(agendamento);
    setModalInfo({ visible: true, horario });
  };

  const fecharModal = () => {
    setModalInfo({ visible: false, horario: "" });
    setForm({ animal: "", tutor: "", servico: [], profissional: "" });
  };

  const salvar = async () => {
    const horario = modalInfo.horario;
    await setDoc(doc(db, "agendamentos", dataSelecionada, "horarios", horario), form);
    setAgendamentos({ ...agendamentos, [horario]: { ...form } });
    fecharModal();
  };

  const excluir = async () => {
    const horario = modalInfo.horario;
    await deleteDoc(doc(db, "agendamentos", dataSelecionada, "horarios", horario));
    const novos = { ...agendamentos };
    delete novos[horario];
    setAgendamentos(novos);
    fecharModal();
  };

  const toggleServico = (servico) => {
    setForm((prev) => {
      const existe = prev.servico.includes(servico);
      return {
        ...prev,
        servico: existe ? prev.servico.filter((s) => s !== servico) : [...prev.servico, servico],
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="bg-blue-600 text-white p-4 shadow rounded mb-6">
        <h1 className="text-2xl font-bold">📅 Agenda de Serviços</h1>
      </header>

      <div className="mb-4 flex items-center gap-2 justify-center">
        <button
          onClick={() =>
            setDataSelecionada(
              new Date(new Date(dataSelecionada).getTime() - 86400000).toISOString().split("T")[0]
            )
          }
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          ◀ Dia anterior
        </button>
        <input
          type="date"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          className="border rounded px-3 py-1"
        />
        <button
          onClick={() =>
            setDataSelecionada(
              new Date(new Date(dataSelecionada).getTime() + 86400000).toISOString().split("T")[0]
            )
          }
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Próximo dia ▶
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {horarios.map((hora) => (
          <div
            key={hora}
            onClick={() => abrirModal(hora)}
            className={`p-4 rounded-xl shadow cursor-pointer transition-transform duration-200 hover:scale-[1.02] ${
              agendamentos[hora] ? "bg-green-200 border border-green-400" : "bg-white border border-gray-300"
            }`}
          >
            <strong className="block text-lg mb-1">{hora}</strong>
            {agendamentos[hora] && (
              <div className="text-sm text-gray-800 space-y-1">
                <div>🐶 {agendamentos[hora].animal}</div>
                <div>👤 {agendamentos[hora].tutor}</div>
                <div>🛁 {Array.isArray(agendamentos[hora].servico) ? agendamentos[hora].servico.join(", ") : agendamentos[hora].servico}</div>
                <div>💇 {agendamentos[hora].profissional}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {modalInfo.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Agendar {modalInfo.horario}</h2>
            <input
              className="w-full mb-2 p-2 border rounded"
              placeholder="Nome do animal"
              value={form.animal}
              onChange={(e) => setForm({ ...form, animal: e.target.value })}
            />
            <input
              className="w-full mb-2 p-2 border rounded"
              placeholder="Nome do tutor"
              value={form.tutor}
              onChange={(e) => setForm({ ...form, tutor: e.target.value })}
            />
            <div className="mb-2">
              <label className="block mb-1 font-medium">Serviços:</label>
              <div className="flex flex-wrap gap-2">
                {servicosDisponiveis.map((s) => (
                  <label key={s} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={form.servico.includes(s)}
                      onChange={() => toggleServico(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <select
              className="w-full mb-4 p-2 border rounded"
              value={form.profissional}
              onChange={(e) => setForm({ ...form, profissional: e.target.value })}
            >
              <option value="">Selecione o profissional</option>
              {profissionais.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
            <div className="flex justify-between">
              <button onClick={salvar} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                💾 Salvar
              </button>
              <button onClick={excluir} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                🗑️ Excluir
              </button>
              <button onClick={fecharModal} className="text-gray-600 hover:underline px-2">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
