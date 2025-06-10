import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { db } from './firebase';
import { collection, query, onSnapshot, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import ModalDelivery from './ModalDelivery';
import DeliveryCard from './DeliveryCard';

export default function Logistica({ usuario }) {
  const [deliveries, setDeliveries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deliverySendoEditado, setDeliverySendoEditado] = useState(null);
  const userRole = usuario.claims.role;

  // ======================================================= //
  // =====         useEffect SUBSTITUÍDO AQUI         =====  //
  // ======================================================= //
 // Em src/Logistica.jsx, substitua seu useEffect por este:
// Em Logistica.jsx, esta é a versão final e correta do seu useEffect:
useEffect(() => {
    const q = query(collection(db, 'delivery'), orderBy('dataCriacao', 'desc'));

    // A mágica do onSnapshot é que ele já "ouve" as mudanças sozinho.
    // Nós só precisamos configurar o ouvinte UMA VEZ.
    const unsubscribe = onSnapshot(q, (snapshot) => {

        // Para cada mudança detectada desde a última vez
        snapshot.docChanges().forEach((change) => {
            // Se um documento existente foi modificado
            if (change.type === 'modified') {
                const docData = change.doc.data();

                // Usamos uma função no setDeliveries para garantir que temos
                // a lista mais atual para comparar, sem causar um loop.
                setDeliveries(currentDeliveries => {
                    const deliveryAntigo = currentDeliveries.find(d => d.id === change.doc.id);

                    // A CONDIÇÃO MÁGICA
                    if (docData.status === 'Concluído' && deliveryAntigo?.status !== 'Concluído') {
                        if (['gerente', 'atendente'].includes(userRole)) {
                            toast.success(`A tarefa de '${docData.clienteNome}' foi concluída!`, {
                                icon: '✅',
                                duration: 5000,
                            });
                        }
                    }
                    // A função do setDeliveries sempre precisa retornar o novo estado.
                    // Aqui, simplesmente retornamos a lista que já ia ser atualizada.
                    // Isso evita uma renderização extra.
                    return currentDeliveries;
                });
            }
        });

        // Atualiza a lista completa na tela para refletir todas as mudanças
        const deliveriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDeliveries(deliveriesData);
    });

    return () => unsubscribe();

// Apenas 'userRole' como dependência. O useEffect só vai rodar de novo
// se o perfil do usuário mudar, o que é o comportamento correto.
}, [userRole]);
  // ======================================================= //
  // ===== FIM DA SEÇÃO SUBSTITUÍDA                      ===== //
  // ======================================================= //


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
            onStatusChange={handleStatusChange} 
          />
        ))}
      </div>
    </div>
  );
}