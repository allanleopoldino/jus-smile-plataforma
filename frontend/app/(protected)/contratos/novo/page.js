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
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. Busca Especialidades
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await apiFetch('/specialties');
        if (response.ok) setSpecialties(await response.json());
        else { const err = await response.json(); showError(err.error); }
      } catch (error) { showError(error.message); }
    };
    fetchSpecialties();
  }, [apiFetch, showError]);

  // 2. Busca Procedimentos
  useEffect(() => {
    setProcedures([]); setProcedureDetails(null); setSelectedProcedureId('');
    if (selectedSpecialty) {
      const fetchProcedures = async () => {
        try {
          const response = await apiFetch(`/specialties/${selectedSpecialty}/procedures`);
          if (response.ok) setProcedures(await response.json());
          else { const err = await response.json(); showError(err.error); }
        } catch (error) { showError(error.message); }
      };
      fetchProcedures();
    }
  }, [selectedSpecialty, apiFetch, showError]);

  // 3. Busca Detalhes
  useEffect(() => {
    if (selectedProcedureId) {
      const fetchDetails = async () => {
        try {
          const response = await apiFetch(`/procedures/${selectedProcedureId}`);
          if (response.ok) {
            const data = await response.json();
            setProcedureDetails(data);
            // Extrai placeholders
            const matches = data.content_template.match(/{{(.*?)}}/g) || [];
            const placeholders = [...new Set(matches.map(p => p.replace(/{{|}}/g, '')))];
            setFormPlaceholders(placeholders);
            setFormData(placeholders.reduce((acc, p) => ({ ...acc, [p]: '' }), {}));
          } else { const err = await response.json(); showError(err.error); }
        } catch (error) { showError(error.message); }
      };
      fetchDetails();
    } else { setProcedureDetails(null); }
  }, [selectedProcedureId, apiFetch, showError]);

  const handleDownloadPdf = async (e) => {
    e.preventDefault();
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('token'); // Fetch manual precisa do token manual
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/procedures/${selectedProcedureId}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (response.status === 401) { router.push('/login'); throw new Error('Sessão expirada'); }
      if (!response.ok) { const err = await response.json(); throw new Error(err.error); }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${procedureDetails.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) { showError(error.message); } 
    finally { setIsDownloading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Novo contrato</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Especialidade</label>
            <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)} className="w-full mt-1 border rounded-md p-2">
              <option value="">Selecione</option>
              {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Procedimento</label>
            <select value={selectedProcedureId} onChange={(e) => setSelectedProcedureId(e.target.value)} disabled={!procedures.length} className="w-full mt-1 border rounded-md p-2 disabled:bg-gray-100">
              <option value="">Selecione</option>
              {procedures.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        </div>

        {procedureDetails && (
          <form onSubmit={handleDownloadPdf}>
            <div className="border-t pt-6 space-y-4">
              <h2 className="text-xl font-bold text-brand-brown">{procedureDetails.title}</h2>
              {formPlaceholders.map(ph => (
                <div key={ph}>
                  <label className="block text-sm font-medium capitalize">{ph.replace(/_/g, ' ').toLowerCase()}</label>
                  <textarea value={formData[ph] || ''} onChange={e => setFormData({...formData, [ph]: e.target.value})} className="w-full mt-1 border rounded-md p-2" required />
                </div>
              ))}
              <button type="submit" disabled={isDownloading} className="bg-brand-brown text-white font-bold py-2 px-6 rounded hover:opacity-90 disabled:bg-gray-400 mt-4">
                {isDownloading ? 'Gerando PDF...' : 'Gerar e Baixar PDF'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}