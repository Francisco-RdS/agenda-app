import React, { useState } from 'react';
import { db } from './firebase';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import ModalDelivery from './ModalDelivery';
import DeliveryCard from './DeliveryCard';
import GerenciadorRotas from './GerenciadorRotas';

// O componente continua recebendo 'usuario' e a lista de 'deliveries' do App.jsx
export default function Logistica({ usuario, deliveries }) { 
  // NOVO ESTADO para controlar a visualização
  const [subView, setSubView] = useState('diario'); 

  // Seus estados e variáveis existentes
  const [showModal, setShowModal] = useState(false);
  const [deliverySendoEditado, setDeliverySendoEditado] = useState(null);
  const userRole = usuario.claims.role;

  // Todas as suas funções de manipulação de dados (handle...) continuam aqui, sem alterações.
  const handleCloseModal = () => {
    setShowModal(false);
    setDeliverySendoEditado(null);
  };

  const handleOpenModalParaEditar = (delivery) => {
    setDeliverySendoEditado(delivery);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    if (deliverySendoEditado?.id) {
      const deliveryRef = doc(db, 'delivery', deliverySendoEditado.id);
      await updateDoc(deliveryRef, formData);
    } else {
      await addDoc(collection(db, 'delivery'), {
        ...formData,
        dataCriacao: new Date(),
      });
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
        await deleteDoc(doc(db, 'delivery', id));
    }
  };

  const handleStatusChange = async (deliveryId, novoStatus) => {
    const deliveryRef = doc(db, 'delivery', deliveryId);
    await updateDoc(deliveryRef, {
      status: novoStatus
    });
  };


  return (
    <div>
      {/* ===== INÍCIO DAS ALTERAÇÕES ===== */}

      {/* CABEÇALHO PRINCIPAL */}
      <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Painel de Logística</h1>
          {/* O botão de "Adicionar" só aparece na visão de tarefas diárias */}
          {subView === 'diario' && ['gerente', 'atendente'].includes(userRole) && (
              <button onClick={() => setShowModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600">
                  + Adicionar Tarefa do Dia
              </button>
          )}
      </div>

      {/* BOTÕES DE SUB-NAVEGAÇÃO */}
      <div className="mb-4 flex gap-2 border-b pb-2">
          <button 
              onClick={() => setSubView('diario')} 
              className={`px-4 py-2 rounded-md font-semibold text-sm ${subView === 'diario' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
              Tarefas do Dia
          </button>
          <button 
              onClick={() => setSubView('semanal')}
              className={`px-4 py-2 rounded-md font-semibold text-sm ${subView === 'semanal' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
              Rotas Semanais
          </button>
      </div>

      {/* CONTEÚDO DINÂMICO QUE MUDA DE ACORDO COM O BOTÃO CLICADO */}
      {subView === 'diario' ? (
          // Se a visão for 'diario', mostramos o conteúdo que já existia
          <>
              {showModal && (
                  <ModalDelivery
                      onClose={handleCloseModal}
                      onSave={handleSave}
                      delivery={deliverySendoEditado}
                  />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deliveries.map((delivery) => (
                      <DeliveryCard
                          key={delivery.id}
                          delivery={delivery}
                          userRole={userRole}
                          onEdit={() => handleOpenModalParaEditar(delivery)}
                          onDelete={() => handleDelete(delivery.id)}
                          onStatusChange={handleStatusChange} 
                      />
                  ))}
              </div>
          </>
      ) : (
    // Chamando o nosso novo componente e passando o usuário para ele
    <GerenciadorRotas usuario={usuario} />
)}
      {/* ===== FIM DAS ALTERAÇÕES ===== */}
    </div>
  );
}