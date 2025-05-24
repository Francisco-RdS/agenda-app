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
        data[doc.id] = doc.data().lista || [];
      });
      setAgendamentos(data);
    };
    fetchAgendamentos();
  }, [dataSelecionada]);

  const abrirModal = (horario) => {
    setForm({ animal: "", tutor: "", servico: [], profissional: "" });
    setModalInfo({ visible: true, horario });
  };

  const fecharModal = () => {
    setModalInfo({ visible: false, horario: "" });
    setForm({ animal: "", tutor: "", servico: [], profissional: "" });
  };

  const salvar = async () => {
    const horario = modalInfo.horario;
    const agendamentosHora = agendamentos[horario] || [];
    const novos = [...agendamentosHora, form];
    await setDoc(doc(db, "agendamentos", dataSelecionada, "horarios", horario), { lista: novos });
    setAgendamentos({ ...agendamentos, [horario]: novos });
    fecharModal();
  };

  const excluir = async (index) => {
    const horario = modalInfo.horario;
    const novaLista = [...(agendamentos[horario] || [])];
    novaLista.splice(index, 1);
    if (novaLista.length === 0) {
      await deleteDoc(doc(db, "agendamentos", dataSelecionada, "horarios", horario));
      const novos = { ...agendamentos };
      delete novos[horario];
      setAgendamentos(novos);
    } else {
      await setDoc(doc(db, "agendamentos", dataSelecionada, "horarios", horario), { lista: novaLista });
      setAgendamentos({ ...agendamentos, [horario]: novaLista });
    }
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
      <h1 className="text-2xl font-bold mb-4">Agenda</h1>

      {/* Navegação de datas */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() =>
            setDataSelecionada(
              new Date(new Date(dataSelecionada).getTime() - 86400000).toISOString().split("T")[0]
            )
          }
          className="px-2 py-1 bg-gray-200 rounded"
        >
          ◀ Dia anterior
        </button>
        <input
          type="date"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button
          onClick={() =>
            setDataSelecionada(
              new Date(new Date(dataSelecionada).getTime() + 86400000).toISOString().split("T")[0]
            )
          }
          className="px-2 py-1 bg-gray-200 rounded"
        >
          Próximo dia ▶
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {horarios.map((hora) => {
          const agendamentosHora = agendamentos[hora] || [];
          let bgColor = "bg-white";
          if (agendamentosHora.length === 1) bgColor = "bg-green-200";
          else if (agendamentosHora.length === 2) bgColor = "bg-yellow-200";
          else if (agendamentosHora.length === 3) bgColor = "bg-orange-300";
          else if (agendamentosHora.length >= 4) bgColor = "bg-red-300";

          return (
            <div
              key={hora}
              onClick={() => abrirModal(hora)}
              className={`p-4 rounded-lg shadow cursor-pointer ${bgColor}`}
            >
              <strong>{hora}</strong>
              {agendamentosHora.length > 0 && (
                <div className="text-sm mt-1 space-y-1">
                  {agendamentosHora.map((ag, idx) => (
                    <div key={idx}>
                      <div>🐾 {ag.animal} - {ag.tutor}</div>
                      <div>🛁 {ag.servico.join(", ")}</div>
                      <div>👤 {ag.profissional}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalInfo.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl mb-4">Agendar {modalInfo.horario}</h2>
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
              <label className="block mb-1">Serviços:</label>
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
              <button onClick={salvar} className="bg-blue-500 text-white px-4 py-2 rounded">
                Salvar
              </button>
              <button onClick={fecharModal} className="text-gray-600 px-4 py-2">
                Cancelar
              </button>
            </div>

            {/* Excluir individual */}
            {agendamentos[modalInfo.horario]?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-bold mb-2">Agendamentos existentes:</h3>
                {agendamentos[modalInfo.horario].map((ag, idx) => (
                  <div key={idx} className="text-sm mb-2 border-b pb-1">
                    {ag.animal} - {ag.profissional} - {ag.servico.join(", ")}
                    <button
                      onClick={() => excluir(idx)}
                      className="ml-2 text-red-500 text-xs"
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
