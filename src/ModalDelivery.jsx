// src/ModalDelivery.jsx

import React, { useState, useEffect } from 'react';

// Estado inicial do formulário, usado para criar um novo ou limpar o form
const estadoInicial = {
  tipo: 'Taxi Dog',
  clienteNome: '',
  endereco: '',
  telefone: '',
  petNome: '',
  produtos: '', // Usamos string para o input, e convertemos para array ao salvar
  observacoes: '',
  status: 'Pendente',
};

export default function ModalDelivery({ onClose, onSave, delivery }) {
  const [form, setForm] = useState(estadoInicial);

  // Este efeito roda quando o componente abre. Ele verifica se estamos editando um delivery.
  useEffect(() => {
    if (delivery) {
      // Se estamos editando, preenche o formulário com os dados existentes
      setForm({
        ...delivery,
        produtos: delivery.produtos?.join(', ') || ''
      });
    } else {
      // Se não, garante que o formulário esteja limpo
      setForm(estadoInicial);
    }
  }, [delivery]); // Roda sempre que a prop 'delivery' mudar

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dadosParaSalvar = {
      ...form,
      // Se o tipo for Entrega, converte a string de produtos em um array, removendo espaços e itens vazios
      produtos: form.tipo === 'Entrega' ? form.produtos.split(',').map(p => p.trim()).filter(p => p) : [],
      // Limpa o nome do pet se não for Taxi Dog
      petNome: form.tipo === 'Taxi Dog' ? form.petNome : '',
    };
    onSave(dadosParaSalvar);
_    };

  return (
    // O Fundo escuro do modal
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      {/* O conteúdo do modal */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto mx-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">{delivery ? 'Editar Delivery' : 'Novo Delivery'}</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Serviço</label>
            <select name="tipo" value={form.tipo} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
              <option>Taxi Dog</option>
              <option>Entrega</option>
            </select>
          </div>

          <input type="text" name="clienteNome" placeholder="Nome do Cliente" value={form.clienteNome} onChange={handleChange} className="w-full p-2 border rounded-md" required />
          <input type="text" name="endereco" placeholder="Endereço Completo" value={form.endereco} onChange={handleChange} className="w-full p-2 border rounded-md" required />
          <input type="tel" name="telefone" placeholder="Telefone de Contato" value={form.telefone} onChange={handleChange} className="w-full p-2 border rounded-md" />
          
          {/* Campos condicionais que só aparecem dependendo do 'tipo' */}
          {form.tipo === 'Taxi Dog' && <input type="text" name="petNome" placeholder="Nome do Pet" value={form.petNome} onChange={handleChange} className="w-full p-2 border rounded-md" />}
          {form.tipo === 'Entrega' && <input type="text" name="produtos" placeholder="Produtos (separados por vírgula)" value={form.produtos} onChange={handleChange} className="w-full p-2 border rounded-md" />}
          
          <textarea name="observacoes" placeholder="Observações (opcional)" value={form.observacoes} onChange={handleChange} className="w-full p-2 border rounded-md" />
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md bg-white">
              <option>Pendente</option>
              <option>Em Rota</option>
              <option>Concluído</option>
            </select>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}