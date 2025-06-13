// src/ModalUsuario.jsx

import React, { useState } from 'react';

export default function ModalUsuario({ onClose, onSave, isLoading }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('atendente'); // Perfil padrão

    const handleSubmit = (e) => {
        e.preventDefault();
        // Chama a função de salvar que veio do componente pai, passando os dados
        onSave({ email, password, role });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold mb-4">Criar Novo Usuário</h2>

                    <input
                        type="email"
                        placeholder="Email do novo usuário"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Senha para o novo usuário"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Perfil do Usuário</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md bg-white"
                        >
                            <option value="atendente">Atendente</option>
                            <option value="motorista">Motorista</option>
                            <option value="gerente">Gerente</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400" disabled={isLoading}>
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar Usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}