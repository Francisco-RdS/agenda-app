import React, { useEffect, useState } from "react";
import "./index.css"; // Supondo que você tenha este arquivo CSS
import { db } from "./firebase"; // Supondo que sua configuração do firebase está aqui
import { v4 as uuidv4 } from "uuid";
import { arrayUnion } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login";

import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

// Gera a lista de horários disponíveis
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
  const [animalSelecionadoIndex, setAnimalSelecionadoIndex] = useState(null);

  const [menuAberto, setMenuAberto] = useState(false);
  const [anotacaoTexto, setAnotacaoTexto] = useState("");
  // const [anotacaoHoje, setAnotacaoHoje] = useState(""); // Removido, 'anotacoes' (array) guarda as notas do dia
  // const [anotacaoAmanha, setAnotacaoAmanha] = useState(""); // Removido, não mostraremos mais notas do dia seguinte
  const [anotacoes, setAnotacoes] = useState([]); // Armazena as anotações para o dia selecionado
  const [editandoId, setEditandoId] = useState(null);
  const [textoEditado, setTextoEditado] = useState("");
  // const [editandoAnotacao, setEditandoAnotacao] = useState(false); // Este estado não parecia estar em uso
  const [usuarioLogado, setUsuarioLogado] = useState(null);


  const profissionais = [
    "Silvia", "Taty", "Italo", "Marcelo", "Marcos", "Eliene",
    "Francisco", "Raimundo", "Vera",
  ];
  const servicosDisponiveis = [
    "Banho", "Tosa", "Tosa Higienica", "Hidratação", "Remoção",
  ];
  const cores = [
    "#e63946", "#457b9d", "#2a9d8f", "#f4a261", "#b5838d",
    "#6d6875", "#118ab2", "#06d6a0", "#ef476f",
  ];

  const colorByIndex = (i) => cores[i % cores.length];

  // Função para salvar uma nova anotação para o dia selecionado
  const salvarAnotacao = async () => {
    if (!anotacaoTexto.trim()) return; // Não salvar anotações vazias

    const hoje = dataSelecionada;

    const novaAnotacao = {
      id: uuidv4(), // Gera um ID único para a anotação
      texto: anotacaoTexto,
    };

    // Adiciona a nova anotação ao array 'anotacoes' no Firestore para o dia 'hoje'
    await setDoc(
      doc(db, "anotacoes", hoje),
      {
        anotacoes: arrayUnion(novaAnotacao), // arrayUnion adiciona o elemento se ele não existir
      },
      { merge: true } // merge:true preserva outros campos do documento se existirem
    );

    setAnotacaoTexto(""); // Limpa o campo de input da anotação

    // Recarrega as anotações do dia atual para refletir a nova anotação
    const docAtualizado = await getDoc(doc(db, "anotacoes", hoje));
    if (docAtualizado.exists()) {
      const dados = docAtualizado.data();
      setAnotacoes(dados.anotacoes || []);
    } else {
      // Teoricamente, não deveria cair aqui se acabamos de salvar, mas é uma boa prática
      setAnotacoes([novaAnotacao]); // Se o doc não existia, a nova anotação é a única
    }
    
    // A lógica para salvar ou definir 'anotacaoAmanha' foi removida daqui.
    // setMenuAberto(false); // Descomente se desejar que o menu de anotações feche após salvar.
  };

  // useEffect para carregar as anotações específicas do dia selecionado ('dataSelecionada')
  useEffect(() => {
    const carregarAnotacoesDoDia = async () => {
      const dia = dataSelecionada;
      const docRef = doc(db, "anotacoes", dia); // Referência ao documento de anotações do dia
      const docSnap = await getDoc(docRef); // Busca o documento

      if (docSnap.exists()) {
        // Se o documento existir, atualiza o estado com as anotações (ou um array vazio se não houver)
        setAnotacoes(docSnap.data().anotacoes || []);
      } else {
        // Se o documento não existir, define as anotações como um array vazio
        setAnotacoes([]);
      }
    };
    carregarAnotacoesDoDia();
  }, [dataSelecionada]); // Executa sempre que 'dataSelecionada' mudar

  // useEffect para carregar os agendamentos do dia selecionado
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
  }, [dataSelecionada]); // Executa sempre que 'dataSelecionada' mudar

  //useEffect para carregar usuários logados
  useEffect(() => {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUsuarioLogado(user);
  });

  return () => unsubscribe();
}, []);


  // Abre o modal de agendamento, populando com dados existentes se houver
  const abrirModal = (horario) => {
    const animaisNoHorario = agendamentos[horario]?.animais || [];
    if (animaisNoHorario.length > 0) {
      setAnimalSelecionadoIndex(0); // Seleciona o primeiro animal por padrão ao abrir
      setForm(animaisNoHorario[0]);
    } else {
      setAnimalSelecionadoIndex(null); // Nenhum animal selecionado
      setForm({ animal: "", tutor: "", servico: [], profissional: "" }); // Limpa o formulário
    }
    setModalInfo({ visible: true, horario });
  };

  // Fecha o modal de agendamento e limpa os estados relacionados
  const fecharModal = () => {
    setModalInfo({ visible: false, horario: "" });
    setForm({ animal: "", tutor: "", servico: [], profissional: "" });
    setAnimalSelecionadoIndex(null);
  };

  // Salva um novo agendamento ou atualiza um existente
  const salvar = async () => {
    const horario = modalInfo.horario;
    const ref = doc(db, "agendamentos", dataSelecionada, "horarios", horario);
    const snap = await getDoc(ref);
    let existentes = [];
    if (snap.exists()) {
      existentes = snap.data().animais || [];
    }

    if (animalSelecionadoIndex !== null) { // Atualizando um animal existente
      existentes[animalSelecionadoIndex] = form;
    } else { // Adicionando um novo animal
      existentes.push(form);
    }

    await setDoc(ref, { animais: existentes });
    setAgendamentos({ ...agendamentos, [horario]: { animais: existentes } });
    fecharModal();
  };

  // Exclui um animal de um horário específico
  const excluirAnimal = async () => {
    const horario = modalInfo.horario;
    const ref = doc(db, "agendamentos", dataSelecionada, "horarios", horario);
    const snap = await getDoc(ref);
    if (!snap.exists()) return fecharModal(); // Se não existe, não há o que excluir

    const existentes = snap.data().animais || [];
    if (animalSelecionadoIndex === null) return fecharModal(); // Nenhum animal selecionado para excluir

    existentes.splice(animalSelecionadoIndex, 1); // Remove o animal da lista

    if (existentes.length === 0) { // Se não houver mais animais nesse horário, exclui o documento do horário
      await deleteDoc(ref);
      const novosAgendamentos = { ...agendamentos };
      delete novosAgendamentos[horario];
      setAgendamentos(novosAgendamentos);
    } else { // Caso contrário, atualiza o documento com a lista reduzida de animais
      await setDoc(ref, { animais: existentes });
      setAgendamentos({ ...agendamentos, [horario]: { animais: existentes } });
    }
    fecharModal();
  };

  // Alterna a seleção de um serviço no formulário do modal
  const toggleServico = (servico) => {
    setForm((prev) => {
      const existe = prev.servico.includes(servico);
      return {
        ...prev,
        servico: existe
          ? prev.servico.filter((s) => s !== servico) // Remove se já existe
          : [...prev.servico, servico], // Adiciona se não existe
      };
    });
  };

  // Seleciona um animal existente no modal para edição
  const selecionarAnimal = (index) => {
    setAnimalSelecionadoIndex(index);
    const animal = agendamentos[modalInfo.horario].animais[index];
    setForm(animal);
  };

  if (!usuarioLogado) {
  return <Login />;
}

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {usuarioLogado && (
  <button
    onClick={() => signOut(getAuth())}
    className="bg-red-500 text-white px-3 py-1 rounded text-sm ml-4"
  >
    Sair
  </button>
)}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="relative">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="text-3xl p-2"
          >
            ☰ {/* Ícone do menu hambúrguer */}
          </button>
          {/* Sino de notificação para 'anotacaoAmanha' foi removido daqui */}
        </div>
      </div>

      {/* Menu lateral de anotações */}
      {menuAberto && (
        <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg z-50 p-4 overflow-y-auto">
          {/* Título do menu de anotações agora mostra a data selecionada */}
          <h2 className="text-xl font-semibold mb-4">Anotações para {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR')}</h2>

          {/* Lista de Anotações do Dia Selecionado */}
          {anotacoes.length === 0 && <p className="text-sm text-gray-500 mb-4">Nenhuma anotação para este dia.</p>}
          {anotacoes.map((anotacao) => (
            <div key={anotacao.id} className="bg-green-100 p-3 rounded mb-4">
              {editandoId === anotacao.id ? ( // Se estiver editando esta anotação
                <>
                  <textarea
                    className="w-full border rounded p-2"
                    rows="3"
                    value={textoEditado}
                    onChange={(e) => setTextoEditado(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={async () => { // Salvar edição
                        const novaLista = anotacoes.map((a) =>
                          a.id === anotacao.id ? { ...a, texto: textoEditado } : a
                        );
                        await setDoc(
                          doc(db, "anotacoes", dataSelecionada),
                          { anotacoes: novaLista },
                          { merge: true }
                        );
                        setAnotacoes(novaLista);
                        setEditandoId(null); // Finaliza modo de edição
                        setTextoEditado("");  // Limpa texto editado
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => { // Cancelar edição
                        setEditandoId(null);
                        setTextoEditado("");
                      }}
                      className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : ( // Visualização normal da anotação
                <>
                  <p className="text-sm whitespace-pre-wrap break-words">{anotacao.texto}</p>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => { // Entrar no modo de edição
                        setEditandoId(anotacao.id);
                        setTextoEditado(anotacao.texto);
                      }}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => { // Excluir anotação
                        const novaLista = anotacoes.filter((a) => a.id !== anotacao.id);
                        await setDoc(
                          doc(db, "anotacoes", dataSelecionada),
                          { anotacoes: novaLista },
                          { merge: true }
                        );
                        setAnotacoes(novaLista);
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Campo para nova anotação */}
          <textarea
            className="w-full border rounded p-2 mb-4"
            rows="4"
            placeholder="Escreva nova anotação..." // Placeholder atualizado
            value={anotacaoTexto}
            onChange={(e) => setAnotacaoTexto(e.target.value)}
          />
          <button
            onClick={salvarAnotacao}
            className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-4"
          >
            Salvar nova anotação
          </button>

          {/* A seção "Anotação de amanhã" foi removida daqui */}

          {/* Botão para fechar o menu de anotações */}
          <button
            onClick={() => {
              setMenuAberto(false);
              setEditandoId(null); // Reseta o estado de edição ao fechar o menu
              setTextoEditado("");
            }}
            className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl"
          >
            × {/* Ícone de fechar */}
          </button>
        </div>
      )}

      {/* Navegação de datas */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() =>
            setDataSelecionada( // Navega para o dia anterior
              new Date(new Date(dataSelecionada).getTime() - 86400000) // Subtrai 24h em milissegundos
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
            setDataSelecionada( // Navega para o próximo dia
              new Date(new Date(dataSelecionada).getTime() + 86400000) // Adiciona 24h em milissegundos
                .toISOString()
                .split("T")[0]
            )
          }
          className="px-2 py-1 bg-gray-200 rounded"
        >
          Próximo dia ▶
        </button>
      </div>

      {/* Grade dos horários com agendamentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {horarios.map((hora) => (
          <div
            key={hora}
            onClick={() => abrirModal(hora)}
            className={`p-4 rounded-lg shadow cursor-pointer ${
              agendamentos[hora] ? "bg-green-300" : "bg-white" // Muda a cor se houver agendamento
            }`}
          >
            <strong>{hora}</strong>
            {agendamentos[hora]?.animais?.map((a, index) => ( // Exibe os animais agendados
              <div
                key={index}
                className="text-sm mt-2 p-2 rounded border bg-white"
              >
                <div className="font-semibold text-gray-700">
                  🐾 {a.animal} - {a.profissional}
                </div>
                <div className="text-xs text-gray-500">Tutor: {a.tutor}</div>
                <div className="flex flex-wrap mt-1 gap-1">
                  {a.servico.map((s, i) => ( // Exibe os serviços
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

      {/* Modal de Agendamento/Edição */}
      {modalInfo.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96 max-h-[90vh] overflow-auto">
            <h2 className="text-xl mb-4">Agendar para {modalInfo.horario}</h2>

            {/* Dropdown para selecionar animal existente ou criar novo */}
            {agendamentos[modalInfo.horario]?.animais?.length > 0 && (
              <select
                className="w-full mb-4 p-2 border rounded"
                value={animalSelecionadoIndex ?? ""} // Usa string vazia se animalSelecionadoIndex for null
                onChange={(e) => {
                  const idx =
                    e.target.value === "" ? null : Number(e.target.value);
                  if (idx === null) { // Se "Novo animal" for selecionado
                    setForm({
                      animal: "",
                      tutor: "",
                      servico: [],
                      profissional: "",
                    });
                    setAnimalSelecionadoIndex(null);
                  } else { // Se um animal existente for selecionado
                    selecionarAnimal(idx);
                  }
                }}
              >
                <option value="">Novo animal</option>
                {agendamentos[modalInfo.horario].animais.map((a, i) => (
                  <option key={i} value={i}>
                    {a.animal} - {a.profissional}
                  </option>
                ))}
              </select>
            )}

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
              onChange={(e) =>
                setForm({ ...form, profissional: e.target.value })
              }
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
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Salvar
              </button>
              <button
                onClick={excluirAnimal}
                disabled={animalSelecionadoIndex === null} // Desabilita se nenhum animal existente está selecionado
                className={`text-white px-4 py-2 rounded ${animalSelecionadoIndex === null ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
              >
                Excluir
              </button>
              <button
                onClick={fecharModal}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
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