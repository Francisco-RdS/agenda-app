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
  useEffect(() => {
    const q = query(collection(db, 'delivery'), orderBy('dataCriacao', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        // Analisa cada mudança individualmente
        snapshot.docChanges().forEach((change) => {
            // Nós só nos importamos com documentos que foram MODIFICADOS
            if (change.type === 'modified') {
                const docData = change.doc.data();

                // Encontra o estado antigo desse delivery na nossa lista atual
                const deliveryAntigo = deliveries.find(d => d.id === change.doc.id);

                // A CONDIÇÃO MÁGICA:
                // O status novo é 'Concluído' E o status antigo NÃO ERA 'Concluído'?
                if (docData.status === 'Concluído' && deliveryAntigo?.status !== 'Concluído') {
                    
                    // E o usuário atual é gerente ou atendente?
                    if (['gerente', 'atendente'].includes(userRole)) {
                        // Se tudo for verdade, disparamos a notificação!
                        toast.success(
                            `A tarefa de '${docData.clienteNome}' foi concluída!`,
                            {
                                icon: '✅',
                                duration: 5000, 
                            }
                        );
                    }
                }
            }
        });

        // Após checar as notificações, atualizamos a lista de tarefas na tela
        const deliveriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDeliveries(deliveriesData);
    });

    return () => unsubscribe();

    // Adicionamos 'deliveries' e 'userRole' como dependências para a lógica funcionar corretamente
  }, [deliveries, userRole]); 
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