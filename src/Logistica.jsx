// src/Logistica.jsx

import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import ModalDelivery from './ModalDelivery';
import DeliveryCard from './DeliveryCard';

export default function Logistica({ usuario }) {
  const [deliveries, setDeliveries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deliverySendoEditado, setDeliverySendoEditado] = useState(null);
  const userRole = usuario.claims.role;

  // Efeito para buscar os deliveries do Firestore em tempo real
  useEffect(() => {
    // Usamos 'delivery' como o nome da coleção, como combinamos
    const q = query(collection(db, 'delivery'), orderBy('dataCriacao', 'desc'));
    
    // onSnapshot "ouve" as mudanças no banco de dados e atualiza a tela
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const deliveriesData = [];
      querySnapshot.forEach((doc) => {
        deliveriesData.push({ id: doc.id, ...doc.data() });
      });
      setDeliveries(deliveriesData);
    });

    // Limpa o "ouvinte" quando o componente é desmontado para evitar vazamento de memória
    return () => unsubscribe();
  }, []);

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
      // ATUALIZANDO um delivery existente
      const deliveryRef = doc(db, 'delivery', deliverySendoEditado.id);
      await updateDoc(deliveryRef, formData);
    } else {
      // CRIANDO um novo delivery
      await addDoc(collection(db, 'delivery'), {
        ...formData,
        dataCriacao: new Date(), // Adiciona a data de criação no momento do salvamento
      });
    }
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
        await deleteDoc(doc(db, 'delivery', id));
    }
  };

  // ======================================================= //
  // ===== 1. NOVA FUNÇÃO ADICIONADA AQUI =====              //
  // ======================================================= //
  const handleStatusChange = async (deliveryId, novoStatus) => {
    // Cria uma referência para o documento específico que queremos alterar
    const deliveryRef = doc(db, 'delivery', deliveryId);
    
    // Usa updateDoc para alterar APENAS o campo 'status'
    await updateDoc(deliveryRef, {
      status: novoStatus
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Painel de Logística</h1>
        {['gerente', 'atendente'].includes(userRole) && (
          <button onClick={() => setShowModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600">
            + Adicionar Delivery
          </button>
        )}
      </div>

      {/* Renderiza o modal apenas se showModal for true */}
      {showModal && (
        <ModalDelivery
          onClose={handleCloseModal}
          onSave={handleSave}
          delivery={deliverySendoEditado}
        />
      )}

      {/* Grade para exibir os cartões de delivery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveries.map((delivery) => (
          <DeliveryCard
            key={delivery.id}
            delivery={delivery}
            userRole={userRole}
            onEdit={() => handleOpenModalParaEditar(delivery)}
            onDelete={() => handleDelete(delivery.id)}
            // ======================================================= //
            // ===== 2. NOVA PROP SENDO PASSADA AQUI =====             //
            // ======================================================= //
            onStatusChange={handleStatusChange} 
          />
        ))}
      </div>
    </div>
  );
}