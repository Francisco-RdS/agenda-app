import React, { useEffect, useState } from "react";
import "./index.css"; // Supondo que você tenha este arquivo CSS
import { db } from "./firebase"; // Supondo que sua configuração do firebase está aqui
import { v4 as uuidv4 } from "uuid";
import { arrayUnion } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import Logistica from './Logistica';
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
    const [anotacoes, setAnotacoes] = useState([]);
    const [editandoId, setEditandoId] = useState(null);
    const [textoEditado, setTextoEditado] = useState("");
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [view, setView] = useState('agenda');

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

    const salvarAnotacao = async () => {
        if (!anotacaoTexto.trim()) return;
        const hoje = dataSelecionada;
        const novaAnotacao = { id: uuidv4(), texto: anotacaoTexto };
        await setDoc(doc(db, "anotacoes", hoje), { anotacoes: arrayUnion(novaAnotacao) }, { merge: true });
        setAnotacaoTexto("");
        const docAtualizado = await getDoc(doc(db, "anotacoes", hoje));
        if (docAtualizado.exists()) {
            setAnotacoes(docAtualizado.data().anotacoes || []);
        } else {
            setAnotacoes([novaAnotacao]);
        }
        setMenuAberto(false);
    };

    useEffect(() => {
        const carregarAnotacoesDoDia = async () => {
            const dia = dataSelecionada;
            const docRef = doc(db, "anotacoes", dia);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setAnotacoes(docSnap.data().anotacoes || []);
            } else {
                setAnotacoes([]);
            }
        };
        carregarAnotacoesDoDia();
    }, [dataSelecionada]);

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

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const idTokenResult = await user.getIdTokenResult(true);
                user.claims = idTokenResult.claims;
                setUsuarioLogado(user);
            } else {
                setUsuarioLogado(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (usuarioLogado && usuarioLogado.claims.role === 'motorista') {
            setView('logistica');
        }
    }, [usuarioLogado]);

    const abrirModal = (horario) => {
        const animaisNoHorario = agendamentos[horario]?.animais || [];
        if (animaisNoHorario.length > 0) {
            setAnimalSelecionadoIndex(0);
            setForm(animaisNoHorario[0]);
        } else {
            setAnimalSelecionadoIndex(null);
            setForm({ animal: "", tutor: "", servico: [], profissional: "" });
        }
        setModalInfo({ visible: true, horario });
    };

    const fecharModal = () => {
        setModalInfo({ visible: false, horario: "" });
        setForm({ animal: "", tutor: "", servico: [], profissional: "" });
        setAnimalSelecionadoIndex(null);
    };

    const salvar = async () => {
        const horario = modalInfo.horario;
        const ref = doc(db, "agendamentos", dataSelecionada, "horarios", horario);
        const snap = await getDoc(ref);
        let existentes = snap.exists() ? snap.data().animais || [] : [];
        if (animalSelecionadoIndex !== null) {
            existentes[animalSelecionadoIndex] = form;
        } else {
            existentes.push(form);
        }
        await setDoc(ref, { animais: existentes });
        setAgendamentos({ ...agendamentos, [horario]: { animais: existentes } });
        fecharModal();
    };

    const excluirAnimal = async () => {
        const horario = modalInfo.horario;
        const ref = doc(db, "agendamentos", dataSelecionada, "horarios", horario);
        const snap = await getDoc(ref);
        if (!snap.exists() || animalSelecionadoIndex === null) return fecharModal();
        const existentes = snap.data().animais || [];
        existentes.splice(animalSelecionadoIndex, 1);
        if (existentes.length === 0) {
            await deleteDoc(ref);
            const novosAgendamentos = { ...agendamentos };
            delete novosAgendamentos[horario];
            setAgendamentos(novosAgendamentos);
        } else {
            await setDoc(ref, { animais: existentes });
            setAgendamentos({ ...agendamentos, [horario]: { animais: existentes } });
        }
        fecharModal();
    };

    const toggleServico = (servico) => {
        setForm((prev) => ({
            ...prev,
            servico: prev.servico.includes(servico)
                ? prev.servico.filter((s) => s !== servico)
                : [...prev.servico, servico],
        }));
    };

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
            <nav className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-white p-3 rounded-lg shadow-md mb-4">
                <div>
                    {usuarioLogado && !['motorista'].includes(usuarioLogado?.claims?.role) && (
                        <button onClick={() => setView('agenda')} className={`px-4 py-2 rounded-md font-semibold ${view === 'agenda' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                            🗓️ Agenda
                        </button>
                    )}
                    <button onClick={() => setView('logistica')} className={`${usuarioLogado && !['motorista'].includes(usuarioLogado?.claims?.role) ? 'ml-2' : ''} px-4 py-2 rounded-md font-semibold ${view === 'logistica' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        🚚 Logística
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {usuarioLogado && (
                        <div className="p-1.5 bg-green-200 text-green-800 rounded-md text-sm">
                            Logado como: <strong>{usuarioLogado.email}</strong> ({usuarioLogado?.claims?.role})
                        </div>
                    )}
                    <button onClick={() => signOut(getAuth())} className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600">
                        Sair
                    </button>
                </div>
            </nav>

            {view === 'agenda' ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold">Agenda</h1>
                        <div className="relative">
                            <button onClick={() => setMenuAberto(!menuAberto)} className="text-3xl p-2">
                                ☰
                            </button>
                        </div>
                    </div>

                    {menuAberto && (
                        <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg z-50 p-4 overflow-y-auto">
                            <h2 className="text-xl font-semibold mb-4">Anotações para {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR')}</h2>
                            {anotacoes.map((anotacao) => (
                                <div key={anotacao.id} className="bg-green-100 p-3 rounded mb-4">
                                    {editandoId === anotacao.id ? (
                                        <>
                                            <textarea className="w-full border rounded p-2" rows="3" value={textoEditado} onChange={(e) => setTextoEditado(e.target.value)} />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={async () => {
                                                    const novaLista = anotacoes.map((a) => a.id === anotacao.id ? { ...a, texto: textoEditado } : a);
                                                    await setDoc(doc(db, "anotacoes", dataSelecionada), { anotacoes: novaLista }, { merge: true });
                                                    setAnotacoes(novaLista);
                                                    setEditandoId(null);
                                                    setTextoEditado("");
                                                }} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Salvar</button>
                                                <button onClick={() => { setEditandoId(null); setTextoEditado(""); }} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">Cancelar</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm whitespace-pre-wrap break-words">{anotacao.texto}</p>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => { setEditandoId(anotacao.id); setTextoEditado(anotacao.texto); }} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">Editar</button>
                                                <button onClick={async () => {
                                                    const novaLista = anotacoes.filter((a) => a.id !== anotacao.id);
                                                    await setDoc(doc(db, "anotacoes", dataSelecionada), { anotacoes: novaLista }, { merge: true });
                                                    setAnotacoes(novaLista);
                                                }} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Excluir</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            <textarea className="w-full border rounded p-2 mb-4" rows="4" placeholder="Escreva nova anotação..." value={anotacaoTexto} onChange={(e) => setAnotacaoTexto(e.target.value)} />
                            <button onClick={salvarAnotacao} className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-4">Salvar nova anotação</button>
                            <button onClick={() => { setMenuAberto(false); setEditandoId(null); setTextoEditado(""); }} className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl">×</button>
                        </div>
                    )}

                    <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
                        <button onClick={() => setDataSelecionada(new Date(new Date(dataSelecionada).getTime() - 86400000).toISOString().split("T")[0])} className="px-2 py-1 bg-gray-200 rounded">
                            ◀ Dia anterior
                        </button>
                        <input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} className="border rounded px-2 py-1" />
                        <button onClick={() => setDataSelecionada(new Date(new Date(dataSelecionada).getTime() + 86400000).toISOString().split("T")[0])} className="px-2 py-1 bg-gray-200 rounded">
                            Próximo dia ▶
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {horarios.map((hora) => (
                            <div key={hora} onClick={() => abrirModal(hora)} className={`p-4 rounded-lg shadow cursor-pointer ${agendamentos[hora] ? "bg-green-300" : "bg-white"}`}>
                                <strong>{hora}</strong>
                                {agendamentos[hora]?.animais?.map((a, index) => (
                                    <div key={index} className="text-sm mt-2 p-2 rounded border bg-white">
                                        <div className="font-semibold text-gray-700">🐾 {a.animal} - {a.profissional}</div>
                                        <div className="text-xs text-gray-500">Tutor: {a.tutor}</div>
                                        <div className="flex flex-wrap mt-1 gap-1">
                                            {a.servico.map((s, i) => (<span key={i} className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: colorByIndex(i) }}>{s}</span>))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {modalInfo.visible && (
                        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
                            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
                                <h2 className="text-xl mb-4">Agendar para {modalInfo.horario}</h2>
                                {agendamentos[modalInfo.horario]?.animais?.length > 0 && (
                                    <select className="w-full mb-4 p-2 border rounded" value={animalSelecionadoIndex ?? ""} onChange={(e) => {
                                        const idx = e.target.value === "" ? null : Number(e.target.value);
                                        if (idx === null) {
                                            setForm({ animal: "", tutor: "", servico: [], profissional: "" });
                                            setAnimalSelecionadoIndex(null);
                                        } else {
                                            selecionarAnimal(idx);
                                        }
                                    }}>
                                        <option value="">Novo animal</option>
                                        {agendamentos[modalInfo.horario].animais.map((a, i) => (<option key={i} value={i}>{a.animal} - {a.profissional}</option>))}
                                    </select>
                                )}
                                <input className="w-full mb-2 p-2 border rounded" placeholder="Nome do animal" value={form.animal} onChange={(e) => setForm({ ...form, animal: e.target.value })} />
                                <input className="w-full mb-2 p-2 border rounded" placeholder="Nome do tutor" value={form.tutor} onChange={(e) => setForm({ ...form, tutor: e.target.value })} />
                                <div className="mb-2">
                                    <label className="block mb-1">Serviços:</label>
                                    <div className="flex flex-wrap gap-2 max-h-28 overflow-auto">
                                        {servicosDisponiveis.map((s) => (<label key={s} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={form.servico.includes(s)} onChange={() => toggleServico(s)} />{s}</label>))}
                                    </div>
                                </div>
                                <select className="w-full mb-4 p-2 border rounded" value={form.profissional} onChange={(e) => setForm({ ...form, profissional: e.target.value })}>
                                    <option value="">Selecione o profissional</option>
                                    {profissionais.map((nome) => (<option key={nome} value={nome}>{nome}</option>))}
                                </select>
                                <div className="flex justify-between">
                                    <button onClick={salvar} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Salvar</button>
                                    <button onClick={excluirAnimal} disabled={animalSelecionadoIndex === null} className={`text-white px-4 py-2 rounded ${animalSelecionadoIndex === null ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}>Excluir</button>
                                    <button onClick={fecharModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <Logistica usuario={usuarioLogado} />
            )}
        </div>
    );
}