'use client';

import { useState, useMemo } from 'react';

const atendimentosTipos = [
  { id: 'judicial', label: 'Judicial' },
  { id: 'administrativo', label: 'Administrativo' },
  { id: 'orientacao_consulta', label: 'Orientação/Consulta Processual' },
  { id: 'acordos', label: 'Acordos' },
  { id: 'segunda_via', label: '2ª Via' },
  { id: 'retificacao', label: 'Retificação/Alteração' },
  { id: 'restauracao', label: 'Restauração' },
  { id: 'registro_tardio', label: 'Registro Tardio' },
  { id: 'reconhecimento_paternidade', label: 'Reconhecimento de Paternidade' },
  { id: 'demandas_familia', label: 'Demandas de Família em geral' },
  { id: 'outras_demandas', label: 'Outras Demandas' }
];

export default function Home() {
  const [formData, setFormData] = useState({
    acao_social: '',
    data_coleta: new Date().toISOString().split('T')[0],
    responsavel: '',
    ...atendimentosTipos.reduce((acc, tipo) => ({ ...acc, [tipo.id]: 0 }), {})
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseInt(value) || 0) : value
    }));
  };

  const total = useMemo(() => {
    return atendimentosTipos.reduce((sum, tipo) => sum + (parseInt(formData[tipo.id]) || 0), 0);
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/coletas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, total })
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Coleta registrada com sucesso!' });
        setFormData({
          acao_social: '',
          data_coleta: new Date().toISOString().split('T')[0],
          responsavel: '',
          ...atendimentosTipos.reduce((acc, tipo) => ({ ...acc, [tipo.id]: 0 }), {})
        });
      } else {
        const err = await response.json();
        setMessage({ type: 'error', text: err.error || 'Erro ao registrar coleta.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro de conexão.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="glass-card">
        <h1 className="text-center mb-4" style={{ color: 'var(--primary-green)' }}>
          Formulário de Coleta de Atendimentos
        </h1>

        {message && (
          <div style={{
            padding: '1rem', marginBottom: '1rem', borderRadius: '8px',
            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#166534' : '#991b1b'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Ação Social</label>
              <input 
                type="text" name="acao_social" className="form-input" 
                value={formData.acao_social} onChange={handleInputChange} required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Data</label>
              <input 
                type="date" name="data_coleta" className="form-input" 
                value={formData.data_coleta} onChange={handleInputChange} required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Responsável pela Coleta</label>
            <input 
              type="text" name="responsavel" className="form-input" 
              value={formData.responsavel} onChange={handleInputChange} required 
            />
          </div>

          <h3 className="mt-4 mb-4" style={{ textAlign: 'center', backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '8px' }}>
            Número Total de Atendimentos DPE
          </h3>

          <table className="premium-table quantities-table">
            <thead>
              <tr>
                <th>Tipos de Atendimentos</th>
                <th style={{ textAlign: 'center' }}>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {atendimentosTipos.map(tipo => (
                <tr key={tipo.id}>
                  <td>{tipo.label}</td>
                  <td>
                    <input 
                      type="number" 
                      min="0"
                      name={tipo.id} 
                      className="form-input" 
                      value={formData[tipo.id] || ''} 
                      onChange={handleInputChange} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="total-display">
            Total de Atendimentos: {total}
          </div>

          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? 'Salvando...' : 'Registrar Coleta'}
          </button>
        </form>
      </div>
    </div>
  );
}
