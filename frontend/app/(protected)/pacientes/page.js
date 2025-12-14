'use client';

import React, { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useError } from '@/context/ErrorContext';
import PatientFormModal from '@/components/PatientFormModal';
import toast from 'react-hot-toast';

export default function PatientsPage() {
  const apiFetch = useApi();
  const { showError } = useError();
  
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // <-- 1. NOVO STATE DA BUSCA
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  // Busca lista do backend
  const fetchPatients = async () => {
    try {
      const response = await apiFetch('/patients');
      if (response.ok) {
        setPatients(await response.json());
      } else {
        showError('Erro ao carregar lista de pacientes.');
      }
    } catch (error) {
      showError('Erro de conexão.');
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [apiFetch, showError]);

  // --- LÓGICA DE FILTRAGEM ---
  // Filtra os pacientes baseado no que foi digitado (Nome ou CPF)
  const filteredPatients = patients.filter(patient => {
    const term = searchTerm.toLowerCase();
    
    // Limpa pontos e traços tanto do termo digitado quanto do CPF do banco
    const termClean = term.replace(/\D/g, ''); 
    const cpfClean = patient.cpf ? patient.cpf.replace(/\D/g, '') : '';

    return (
      patient.name.toLowerCase().includes(term) || 
      cpfClean.includes(termClean) // Compara apenas os números!
    );
  });

  // Ações
  const handleNew = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) return;
    try {
      const response = await apiFetch(`/patients/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Paciente excluído.');
        fetchPatients();
      } else {
        toast.error('Erro ao excluir.');
      }
    } catch (error) {
      toast.error('Erro de conexão.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Cabeçalho e Botão */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciar Pacientes</h1>
        <button 
          onClick={handleNew}
          className="bg-brand-brown text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-colors w-full md:w-auto"
        >
          + Novo Paciente
        </button>
      </div>

      {/* --- 2. BARRA DE PESQUISA --- */}
      <div className="mb-6">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {/* Ícone de Lupa (SVG) */}
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                className="pl-10 block w-full border-gray-300 rounded-md border py-2 focus:ring-brand-brown focus:border-brand-brown shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* 3. Usamos 'filteredPatients' em vez de 'patients' */}
            {filteredPatients.map((patient) => (
              <tr 
                key={patient.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleEdit(patient)}
              >
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{patient.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{patient.cpf}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{patient.phone || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(patient.id); }}
                    className="text-red-600 hover:text-red-900 ml-4 font-bold"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {filteredPatients.length === 0 && (
                <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? 'Nenhum paciente encontrado para essa busca.' : 'Nenhum paciente cadastrado.'}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <PatientFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        patientToEdit={editingPatient}
        onSuccess={fetchPatients} 
      />

    </div>
  );
}