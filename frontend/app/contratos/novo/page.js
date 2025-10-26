'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useError } from '@/context/ErrorContext';
import { useApi } from '@/hooks/useApi';

export default function NewContractPage() {
  const router = useRouter();
  const apiFetch = useApi();
  const { showError } = useError();

  const [specialties, setSpecialties] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedProcedureId, setSelectedProcedureId] = useState('');
  const [procedureDetails, setProcedureDetails] = useState(null);
  const [formPlaceholders, setFormPlaceholders] = useState([]);
  const [formData, setFormData] = useState({});
  const [generatedContract, setGeneratedContract] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // buscar as especialidades
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');

    const fetchSpecialties = async () => {
      try {
        const response = await apiFetch('/specialties');

        if (response.ok) {
          setSpecialties(await response.json());
        } else {
          const errData = await response.json();
          showError(errData.error || 'Falha ao carregar especialidades.');
        }
      } catch (error) {
        showError('Não foi possível conectar ao servidor para buscar especialidades.');
      }
    };
    fetchSpecialties();
  }, [router]);

  // buscar procedimentos quando a especialidade muda
  useEffect(() => {
    const token = localStorage.getItem('token');
    setProcedures([]);
    setProcedureDetails(null);
    setSelectedProcedureId('');

    if (selectedSpecialty && token) {
      const fetchProcedures = async () => {
        try {
          const response = await apiFetch(`/specialties/${selectedSpecialty}/procedures`);

          if (response.ok) {
            setProcedures(await response.json());
          } else {
            const errData = await response.json();
            showError(errData.error || 'Falha ao carregar procedimentos.');
          }
        } catch (error) {
          showError('Não foi possível conectar ao servidor para buscar procedimentos.');
        }
      };
      fetchProcedures();
    }
  }, [selectedSpecialty]);

  // buscar detalhes do procedimento
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (selectedProcedureId && token) {
      const fetchProcedureDetails = async () => {
        try {
          const response = await apiFetch(`/specialties/${selectedSpecialty}/procedures`);

          if (response.ok) {
            const data = await response.json();
            setProcedureDetails(data);
            const placeholders = extractPlaceholders(data.content_template);
            setFormPlaceholders(placeholders);
            const initialFormData = placeholders.reduce((acc, placeholder) => ({ ...acc, [placeholder]: '' }), {});
            setFormData(initialFormData);
          } else {
            // Este bloco 'else' você já tinha feito corretamente!
            const errData = await response.json();
            showError(errData.error || 'Não foi possível carregar os detalhes do procedimento.');
            setProcedureDetails(null);
          }
        } catch (error) { // <-- ALTERAÇÃO: Adiciona catch
          showError('Erro de rede ao buscar detalhes do procedimento.');
        }
      };
      fetchProcedureDetails();
    } else {
      setProcedureDetails(null);
      setFormPlaceholders([]);
      setFormData({});
    }
  }, [selectedProcedureId]);


  const extractPlaceholders = (template) => {
    if (!template) return [];
    const regex = /{{(.*?)}}/g;
    const matches = template.match(regex) || [];
    return [...new Set(matches.map(p => p.replace(/{{|}}/g, '')))];
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  // --- FUNÇÃO PARA GERAR O CONTRATO (COM ERROS TRATADOS) ---
  const handleGenerateContract = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedContract('');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await apiFetch(`/procedures/${selectedProcedureId}`);

      if (response.ok) {
        const data = await response.json();
        setGeneratedContract(data.generated_content);
      } else {
        const errData = await response.json();
        showError(errData.error || 'Ocorreu um erro ao gerar o contrato.');
      }
    } catch (error) {
      showError('Não foi possível conectar ao servidor. Verifique sua conexão.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Novo contrato</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* ... (código dos dropdowns) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
            <select id="specialty" value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-brown focus:border-brand-brown">
              <option value="">Por favor selecione</option>
              {specialties.map(spec => (<option key={spec.id} value={spec.id}>{spec.name}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="procedure" className="block text-sm font-medium text-gray-700 mb-1">Selecione o Procedimento</label>
            <select id="procedure" value={selectedProcedureId} onChange={(e) => setSelectedProcedureId(e.target.value)} disabled={!selectedSpecialty || procedures.length === 0} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-brown focus:border-brand-brown disabled:bg-gray-100">
              <option value="">Por favor selecione</option>
              {procedures.map(proc => (<option key={proc.id} value={proc.id}>{proc.title}</option>))}
            </select>
          </div>
        </div>

        {procedureDetails && (
          <form onSubmit={handleGenerateContract}>
            {/* ... (resto do formulário) ... */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4 text-brand-brown">{procedureDetails.title}</h2>
              <div className="space-y-4">
                {formPlaceholders.map(placeholder => (
                  <div key={placeholder}>
                    <label htmlFor={placeholder} className="block text-sm font-medium text-gray-700 capitalize">
                      {placeholder.replace(/_/g, ' ').toLowerCase()}
                    </label>
                    <textarea id={placeholder} name={placeholder} value={formData[placeholder] || ''} onChange={handleFormChange} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-brown focus:border-brand-brown" required />
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button type="submit" disabled={isGenerating} className="bg-brand-brown text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-90 disabled:bg-gray-400">
                  {isGenerating ? 'Gerando...' : 'Gerar Contrato'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ... (Seção de exibir resultado) ... */}
      {generatedContract && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Contrato Gerado</h2>
          <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap font-sans text-sm">
            {generatedContract}
          </pre>
          <button onClick={() => navigator.clipboard.writeText(generatedContract)} className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600">
            Copiar Texto
          </button>
        </div>
      )}
    </div>
  );
}