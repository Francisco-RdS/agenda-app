// src/DeliveryCard.jsx

import React from 'react';

// 1. Adicionamos a nova prop 'onStatusChange'
export default function DeliveryCard({ delivery, userRole, onEdit, onDelete, onStatusChange }) {
  // O '?' é opcional, mas uma boa prática para evitar erros se a data ainda não chegou do Firebase
  // toDate() converte o formato Timestamp do Firebase para uma data do JavaScript
  const dataFormatada = delivery.dataCriacao?.toDate().toLocaleDateString('pt-BR');

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-2 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-800">{delivery.tipo} - {delivery.clienteNome}</h3>
          
          {/* ===== MUDANÇA REALIZADA AQUI ===== */}
          {/* Se o usuário for motorista, mostra um menu de seleção */}
          {userRole === 'motorista' ? (
            <select
              value={delivery.status}
              onChange={(e) => onStatusChange(delivery.id, e.target.value)}
              className={`p-1 text-xs font-semibold rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 ${
                delivery.status === 'Pendente' ? 'bg-yellow-200 text-yellow-800' : 
                delivery.status === 'Em Rota' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`
              }
              // Impede que clicar no select abra o modal de edição sem querer
              onClick={(e) => e.stopPropagation()} 
            >
              <option value="Pendente">Pendente</option>
              <option value="Em Rota">Em Rota</option>
              <option value="Concluído">Concluído</option>
            </select>
          ) : (
            /* Se não for motorista, mostra o status como texto normal */
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              delivery.status === 'Pendente' ? 'bg-yellow-200 text-yellow-800' : 
              delivery.status === 'Em Rota' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`
            }>
              {delivery.status}
            </span>
          )}
        </div>
        <p className="text-sm"><strong className="font-semibold">Endereço:</strong> {delivery.endereco}</p>
        {delivery.telefone && <p className="text-sm"><strong className="font-semibold">Telefone:</strong> {delivery.telefone}</p>}
        {delivery.tipo === 'Taxi Dog' && <p className="text-sm"><strong className="font-semibold">Pet:</strong> {delivery.petNome}</p>}
        {delivery.tipo === 'Entrega' && delivery.produtos?.length > 0 && <p className="text-sm"><strong className="font-semibold">Produtos:</strong> {delivery.produtos.join(', ')}</p>}
        {delivery.observacoes && <p className="text-sm bg-gray-100 p-2 mt-2 rounded"><strong className="font-semibold">Obs:</strong> {delivery.observacoes}</p>}
        {dataFormatada && <p className="text-xs text-gray-400 mt-2">Criado em: {dataFormatada}</p>}
      </div>

      {/* Os botões de editar e excluir continuam aparecendo apenas para gerente e atendente */}
      {['gerente', 'atendente'].includes(userRole) && (
        <div className="flex justify-end gap-3 border-t pt-2 mt-2">
            <button onClick={onEdit} className="text-sm font-medium text-blue-600 hover:underline">Editar</button>
            <button onClick={onDelete} className="text-sm font-medium text-red-600 hover:underline">Excluir</button>
        </div>
      )}
    </div>
  );
}