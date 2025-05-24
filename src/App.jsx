import React, { useEffect, useState } from "react";
import "./index.css";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

const horarios = Array.from({ length: 19 }, (_, i) => {
  const hora = 8 + Math.floor(i / 2);
  const minuto = i % 2 === 0 ? "00" : "30";
  return `${hora.toString().padStart(2, "0")}:${minuto}`;
});

export default function App() {
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [agendamentos, setAgendamentos] = useState({});
  const [modalInfo, setModalInfo] = useState({ visible: false, horario: "" });
  const [form, setForm] = useState({
    animal: "",
    tutor: "",
    servico: [],
    profissional: "",
  });
  const profissionais = [
    "Silvia",
    "Taty",
    "Italo",
    "Marcelo",
    "Marcos",
    "Eliene",
    "Francisco",
    "Raimundo",
    "Vera",
  ];
  const servicosDisponiveis = [
    "Banho",
    "Tosa",
    "Tosa Higienica",
    "Hidratação",
    "Remoção",
  ];

  const cores = [
    "#e63946",
    "#457b9d",
    "#2a9d8f",
    "#f4a261",
    "#b5838d",
    "#6d6875",
    "#118ab2",
    "#06d6a0",
    "#ef476f",
  ];

  const colorByIndex = (i) => cores[i % cores.length];

  useEffect(() => {
    const fetchAgendamentos = async () => {
      const querySnapshot = await getDocs(
        collection(db, "agendamentos", dataSelecionada, "horarios")
      );
      const data = {};
      querySnapshot.forEach((doc) => {
        data[doc.id] = doc.data();
      });
      setAgendamentos(data);
    };
    fetchAgendamentos();
  }, [dataSelecionada]);

  const abrirModal = (horario) => {
    // Abre modal com formulário vazio para novo animal
    setForm({ animal: "", tutor: "", servico: [], profissional: "" });
    setModalInfo({ visible: true, horario });
  };

  const fecharModal = () => {
    setModalInfo({ visible: false, horario: "" });
    setForm({ animal: "", tutor: "", servico: [], profissional: "" });
  };

  const salvar = async () => {
    const horario = modalInfo.horario;
    const ref = doc(db, "agendamentos", dataSelecionada, "horarios", horario);
    const snap = await getDoc(ref);
    let existentes = [];

    if (snap.exists()) {
      existentes = snap.data().animais || [];
    }

    // Adiciona o novo animal ao array, pode ter múltiplos animais por horário
    const novosAnimais = [...existentes, form];
    await setDoc(ref, { animais: novosAnimais });

    setAgendamentos({ ...agendamentos, [horario]: { animais: novosAnimais } });
    fecharModal();
  };

  const excluir = async () => {
    const horario = modalInfo.horario;
    // Para excluir, vamos remover todos animais desse horário (simplificando)
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
        servico: existe
          ? prev.servico.filter((s) => s !== servico)
          : [...prev.servico, servico],
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
              new Date(new Date(dataSelecionada).getTime() - 86400000)
                .toISOString()
                .split("T")[0]
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
              new Date(new Date(dataSelecionada).getTime() + 86400000)
                .toISOString()
                .split("T")[0]
            )
          }
          className="px-2 py-1 bg-gray-200 rounded"
        >
          Próximo dia ▶
        </button>
      </div>

      {/* Grade dos horários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {horarios.map((hora) => (
          <div
            key={hora}
            onClick={() => abrirModal(hora)}
            className={`p-4 rounded-lg shadow cursor-pointer ${
              agendamentos[hora] ? "bg-green-300" : "bg-white"
            }`}
          >
            <strong>{hora}</strong>

            {agendamentos[hora]?.animais?.map((a, index) => (
              <div
                key={index}
                className="text-sm mt-2 p-2 rounded border bg-white"
              >
                <div className="font-semibold text-gray-700">
                  🐾 {a.animal} - {a.profissional}
                </div>
                <div className="text-xs text-gray-500">Tutor: {a.tutor}</div>
                <div className="flex flex-wrap mt-1 gap-1">
                  {a.servico.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded text-white text-xs"
                      style={{ backgroundColor: colorByIndex(index + i * 3) }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Modal de agendamento */}
      {modalInfo.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 max-h-[90vh] overflow-auto">
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
              <div className="flex flex-wrap gap-2 max-h-28 overflow-auto">
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
              <button
                onClick={salvar}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Salvar
              </button>
              <button
                onClick={excluir}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Excluir horário
              </button>
              <button onClick={fecharModal} className="text-gray-600 px-4 py-2">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
