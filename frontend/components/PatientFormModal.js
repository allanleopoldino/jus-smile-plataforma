'use client';

import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import toast from 'react-hot-toast';

export default function PatientFormModal({ isOpen, onClose, patientToEdit, onSuccess }) {
  const apiFetch = useApi();
  const [isSaving, setIsSaving] = useState(false);

  // Estado inicial vazio
  const initialData = {
    name: '', cpf: '', email: '', phone: '',
    address_zipcode: '', address_street: '', address_number: '',
    address_neighborhood: '', address_city: '', address_state: ''
  };

  const [formData, setFormData] = useState(initialData);

  // EFEITO MÁGICO: Quando a modal abre, decide se preenche os dados ou limpa
  useEffect(() => {
    if (isOpen) {
      if (patientToEdit) {
        // Modo Edição: Preenche com os dados do cliente clicado
        setFormData(patientToEdit);
      } else {
        // Modo Cadastro: Limpa tudo
        setFormData(initialData);
      }
    }
  }, [isOpen, patientToEdit]);

  if (!isOpen) return null; // Se não estiver aberta, não renderiza nada

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função para formatar Telefone (11) 90000-0000
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos

    // Aplica a máscara (XX) XXXXX-XXXX
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let response;
      // DECISÃO IMPORTANTE: Se tem ID, é Edição (PUT). Se não, é Novo (POST).
      if (patientToEdit?.id) {
        response = await apiFetch(`/patients/${patientToEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        response = await apiFetch('/patients', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      if (response.ok) {
        toast.success(patientToEdit ? 'Paciente atualizado!' : 'Paciente cadastrado!');
        onSuccess(); // Avisa a página pai para atualizar a tabela
        onClose();   // Fecha a modal
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao salvar.');
      }
    } catch (error) {
      toast.error('Erro de conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* Cabeçalho da Modal */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-brand-brown">
            {patientToEdit ? 'Editar Paciente' : 'Novo Paciente'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* ... (Mesmos campos do formulário anterior) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nome *</label>
                    <input name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">CPF *</label>
                    <input name="cpf" value={formData.cpf} onChange={handleChange} required className="w-full border rounded p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input name="email" value={formData.email || ''} onChange={handleChange} className="w-full border rounded p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input name="phone" value={formData.phone || ''} onChange={handlePhoneChange}  placeholder="(XX) XXXXX-XXXX" maxLength={15} className="w-full border rounded p-2" />
                </div>
            </div>

             <h3 className="font-bold text-gray-700 mt-4 border-b pb-1">Endereço</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="address_zipcode" placeholder="CEP" value={formData.address_zipcode || ''} onChange={handleChange} className="border rounded p-2" />
                <input name="address_street" placeholder="Rua" value={formData.address_street || ''} onChange={handleChange} className="md:col-span-2 border rounded p-2" />
                <input name="address_number" placeholder="Número" value={formData.address_number || ''} onChange={handleChange} className="border rounded p-2" />
                <input name="address_neighborhood" placeholder="Bairro" value={formData.address_neighborhood || ''} onChange={handleChange} className="border rounded p-2" />
                <input name="address_city" placeholder="Cidade" value={formData.address_city || ''} onChange={handleChange} className="border rounded p-2" />
             </div>

            <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-brand-brown text-white rounded hover:opacity-90 disabled:bg-gray-400">
                    {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}