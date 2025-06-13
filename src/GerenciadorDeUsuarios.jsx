// src/GerenciadorDeUsuarios.jsx

import React, { useState } from 'react';
import { functions } from './firebase'; 
import { httpsCallable } from "firebase/functions";
import { toast } from 'react-hot-toast';
import ModalUsuario from './ModalUsuario';
import ModalPromocao from './ModalPromocao'; // <-- Importamos o novo modal

export default function GerenciadorDeUsuarios() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPromoteModal, setShowPromoteModal] = useState(false); // <-- Novo estado para o modal de promoção
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateUser = async (userData) => {
        setIsLoading(true);
        const createUser = httpsCallable(functions, 'createUser');
        try {
            await createUser(userData);
            toast.success("Usuário criado com sucesso!");
            setShowCreateModal(false);
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Função que chama a promoção, agora recebe os dados do novo modal
    const handlePromoteUser = async (data) => {
        setIsLoading(true);
        const addGerenteRole = httpsCallable(functions, 'addGerenteRole');
        try {
            const result = await addGerenteRole(data);
            toast.success(result.data.message);
            alert("IMPORTANTE: Para que a permissão tenha efeito, o usuário promovido precisa SAIR e fazer o LOGIN novamente.");
            setShowPromoteModal(false);
        } catch (error) {
            console.error("Erro ao promover usuário:", error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {/* Modal para CRIAR usuário */}
            {showCreateModal && (
                <ModalUsuario 
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleCreateUser}
                    isLoading={isLoading}
                />
            )}

            {/* Modal para PROMOVER usuário */}
            {showPromoteModal && (
                <ModalPromocao
                    onClose={() => setShowPromoteModal(false)}
                    onPromover={handlePromoteUser}
                    isLoading={isLoading}
                />
            )}

            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
                <div>
                    <button 
                        onClick={() => setShowPromoteModal(true)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600 mr-4"
                    >
                        Promover a Gerente
                    </button>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600"
                    >
                        + Criar Novo Usuário
                    </button>
                </div>
            </div>
            <p>Em breve, a lista de usuários aparecerá aqui.</p>
        </div>
    );
}