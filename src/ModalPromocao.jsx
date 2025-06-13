// src/ModalPromocao.jsx

import React, { useState } from 'react';

export default function ModalPromocao({ onClose, onPromover, isLoading }) {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onPromover({ email: email.trim() }); // Usamos .trim() por segurança
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold mb-4">Promover Usuário a Gerente</h2>
                    <p className="text-sm text-gray-600">Digite o email do usuário existente que você deseja dar permissões de gerente.</p>
                    
                    <input
                        type="email"
                        placeholder="Email do usuário a ser promovido"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                    />

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400" disabled={isLoading}>
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600" disabled={isLoading}>
                            {isLoading ? 'Promovendo...' : 'Promover a Gerente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}