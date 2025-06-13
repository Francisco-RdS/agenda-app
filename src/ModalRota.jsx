// src/ModalRota.jsx

import React, { useState, useEffect } from 'react';

// O Modal agora aceita uma nova prop: 'rotaExistente'
export default function ModalRota({ onClose, onSave, rotaExistente }) {
    
    // O estado inicial do formulário agora considera se estamos editando ou criando
    const [formData, setFormData] = useState({
        petNome: '',
        tutorNome: '',
        endereco: '',
        telefone: '',
        diaDaSemana: 'Segunda-feira',
        observacoes: ''
    });

    // NOVO EFEITO: Se uma 'rotaExistente' for passada, preenchemos o formulário com seus dados.
    useEffect(() => {
        if (rotaExistente) {
            setFormData(rotaExistente);
        }
    }, [rotaExistente]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto mx-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* O título agora é dinâmico */}
                    <h2 className="text-2xl font-bold mb-4">{rotaExistente ? "Editar Rota Fixa" : "Adicionar Pet à Rota Fixa"}</h2>

                    <input type="text" name="petNome" placeholder="Nome do Pet" value={formData.petNome} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                    <input type="text" name="tutorNome" placeholder="Nome do Tutor" value={formData.tutorNome} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                    <input type="text" name="endereco" placeholder="Endereço Completo" value={formData.endereco} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                    <input type="tel" name="telefone" placeholder="Telefone de Contato" value={formData.telefone} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Dia da Semana da Coleta</label>
                        <select name="diaDaSemana" value={formData.diaDaSemana} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
                            <option>Segunda-feira</option>
                            <option>Terça-feira</option>
                            <option>Quarta-feira</option>
                            <option>Quinta-feira</option>
                            <option>Sexta-feira</option>
                        </select>
                    </div>

                    <textarea name="observacoes" placeholder="Observações (opcional)" value={formData.observacoes} onChange={handleChange} className="w-full p-2 border rounded-md" />

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Salvar na Rota</button>
                    </div>
                </form>
            </div>
        </div>
    );
}