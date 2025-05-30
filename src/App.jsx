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
  const [anotacoes, setAnotacoes] = useState("");
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

  useEffect(() => {
    const fetchDados = async () => {
      // Buscar agendamentos
      const querySnapshot = await getDocs(
        collection(db, "agendamentos", dataSelecionada, "horarios")
      );
      const data = {};
      querySnapshot.forEach((doc) => {
        data[doc.id] = doc.data();
      });
      setAgendamentos(data);

      // Buscar anotações
      const docSnap = await getDoc(doc(db, "anotacoes", dataSelecionada));
      if (docSnap.exists()) {
        setAnotacoes(docSnap.data().texto);
      } else {
        setAnotacoes("");
      }
    };

    fetchDados();
  }, [dataSelecionada]);

  const abrirModal = (horario) => {
    const agendamento =
      agendamentos[horario] || {
        animal: "",
        tutor: "",
        servico: [],
        profissional: "",
      };
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
        servico: existe
          ? prev.servico.filter((s) => s !== servico)
          : [...prev.servico, servico],
      };
    });
  };

  const salvarAnotacoes = async () => {
    try {
      await setDoc(doc(db, "anotacoes", dataSelecionada), { texto: anotacoes });
      alert("Anotações salvas com sucesso!");
    } catch (error) {
      alert("Erro ao salvar anotações: " + error.message);
    }
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
            {agendamentos[hora] && (
              <div className="text-sm mt-1">
                <div>Animal: {agendamentos[hora].animal}</div>
                <div>Tutor: {agendamentos[hora].tutor}</div>
                <div>
                  Serviços:{" "}
                  {Array.isArray(agendamentos[hora].servico)
                    ? agendamentos[hora].servico.join(", ")
                    : agendamentos[hora].servico}
                </div>
                <div>Profissional: {agendamentos[hora].profissional}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
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
                Excluir
              </button>
              <button onClick={fecharModal} className="text-gray-600">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campo de anotações */}
      <div className="mt-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Anotações do dia</h2>
        <textarea
          className="w-full p-2 border rounded"
          rows={4}
          placeholder="Escreva suas anotações aqui..."
          value={anotacoes}
          onChange={(e) => setAnotacoes(e.target.value)}
        />
        <button
          onClick={salvarAnotacoes}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Salvar anotações
        </button>
      </div>
    </div>
  );
}
