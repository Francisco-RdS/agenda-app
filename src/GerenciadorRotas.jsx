import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import ModalRota from './ModalRota';

export default function GerenciadorRotas({ usuario }) {
    const [rotas, setRotas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [rotaSendoEditada, setRotaSendoEditada] = useState(null);
    const userRole = usuario.claims.role;
    
    const motoristasDaRota = ["Marcelo", "Italo"]; // Lembre-se de ajustar se os nomes forem outros
    const diasDaSemana = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];
    
    const getNomeDoDiaDeHoje = () => {
        const nomesDosDias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        return nomesDosDias[new Date().getDay()];
    };

    const [diaSelecionado, setDiaSelecionado] = useState(getNomeDoDiaDeHoje());

    const rotasDoDiaSelecionado = rotas.filter(rota => rota.diaDaSemana === diaSelecionado);

    useEffect(() => {
        const q = query(collection(db, 'rotasSemanais'), orderBy('petNome'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const rotasData = [];
            querySnapshot.forEach((doc) => {
                rotasData.push({ id: doc.id, ...doc.data() });
            });
            setRotas(rotasData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // ===== FUNÇÕES QUE ESTAVAM FALTANDO =====
    const handleSaveRota = async (formData) => {
        try {
            if (rotaSendoEditada) {
                const rotaRef = doc(db, 'rotasSemanais', rotaSendoEditada.id);
                await updateDoc(rotaRef, formData);
            } else {
                await addDoc(collection(db, 'rotasSemanais'), {
                    ...formData,
                    dataCriacao: serverTimestamp()
                });
            }
            handleCloseModal();
        } catch (error) {
            console.error("Erro ao salvar a rota: ", error);
            alert("Ocorreu um erro ao salvar. Tente novamente.");
        }
    };

    const handleDeleteRota = async (rotaId) => {
        if (window.confirm("Tem certeza que deseja excluir este pet da rota fixa?")) {
            try {
                await deleteDoc(doc(db, 'rotasSemanais', rotaId));
            } catch (error) {
                console.error("Erro ao excluir a rota: ", error);
                alert("Ocorreu um erro ao excluir. Tente novamente.");
            }
        }
    };

    const handleOpenModal = (rota = null) => {
        setRotaSendoEditada(rota);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setRotaSendoEditada(null);
    };
    // ===== FIM DAS FUNÇÕES QUE ESTAVAM FALTANDO =====

    if (loading) {
        return <p>Carregando rotas...</p>;
    }

    return (
        <div>
            {showModal && (
                <ModalRota 
                    onClose={handleCloseModal}
                    onSave={handleSaveRota}
                    rotaExistente={rotaSendoEditada}
                    motoristas={motoristasDaRota}
                />
            )}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Rotas Semanais Fixas</h2>
                {['gerente', 'atendente'].includes(userRole) && (
                     <button 
                        onClick={() => handleOpenModal()}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600"
                    >
                        + Adicionar Pet à Rota
                    </button>
                )}
            </div>

            <div className="flex justify-center gap-2 mb-4 p-2 bg-gray-100 rounded-lg">
                {diasDaSemana.map(dia => (
                    <button 
                        key={dia}
                        onClick={() => setDiaSelecionado(dia)}
                        className={`px-3 py-2 rounded-md font-semibold text-sm w-full ${diaSelecionado === dia ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
                    >
                        {dia}
                    </button>
                ))}
            </div>
            
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-700 border-b-2 border-gray-200 pb-1">
                    Exibindo rotas de: <span className="text-blue-600">{diaSelecionado}</span>
                </h3>
                {rotasDoDiaSelecionado.length === 0 ? (
                    <p className="text-gray-500 p-4 text-center">Nenhuma rota para {diaSelecionado}.</p>
                ) : (
                    rotasDoDiaSelecionado.map(rota => (
                        <div key={rota.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">{rota.petNome} - <span className="font-medium">{rota.tutorNome}</span></p>
                                    <p className="text-sm text-gray-600">{rota.endereco}</p>
                                    <p className="text-sm text-gray-600">{rota.telefone}</p>
                                </div>
                                <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">{rota.diaDaSemana}</span>
                            </div>
                            {rota.observacoes && (
                                <p className="text-sm bg-gray-100 p-2 mt-2 rounded"><strong>Obs:</strong> {rota.observacoes}</p>
                            )}
                            
                            {['gerente', 'atendente'].includes(userRole) && (
                                <div className="flex justify-end gap-3 border-t pt-3 mt-3">
                                    <button onClick={() => handleOpenModal(rota)} className="text-sm font-medium text-blue-600 hover:underline">Editar</button>
                                    <button onClick={() => handleDeleteRota(rota.id)} className="text-sm font-medium text-red-600 hover:underline">Excluir</button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}