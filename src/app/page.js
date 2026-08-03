'use client';

import { useState, useMemo } from 'react';

const atendimentosTipos = [
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
    judicial: 0,
    administrativo: 0,
    parceiros: [{ nome: '', quantidade: 0 }],
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
    return atendimentosTipos.reduce((acc, tipo) => acc + (parseInt(formData[tipo.id]) || 0), 0);
  }, [formData]);

  const totalGeral = useMemo(() => {
    const parceirosTotal = formData.parceiros.reduce((sum, p) => sum + (parseInt(p.quantidade) || 0), 0);
    return total + (parseInt(formData.judicial) || 0) + (parseInt(formData.administrativo) || 0) + parceirosTotal;
  }, [total, formData.judicial, formData.administrativo, formData.parceiros]);

  const handleAddParceiro = () => {
    setFormData(prev => ({
      ...prev,
      parceiros: [...prev.parceiros, { nome: '', quantidade: 0 }]
    }));
  };

  const handleParceiroChange = (index, field, value) => {
    setFormData(prev => {
      const newParceiros = [...prev.parceiros];
      newParceiros[index][field] = field === 'quantidade' ? (parseInt(value) || 0) : value;
      return { ...prev, parceiros: newParceiros };
    });
  };

  const handleRemoveParceiro = (index) => {
    setFormData(prev => {
      const newParceiros = prev.parceiros.filter((_, i) => i !== index);
      return { ...prev, parceiros: newParceiros };
    });
  };

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
          judicial: 0,
          administrativo: 0,
          parceiros: [{ nome: '', quantidade: 0 }],
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="text-center mb-0" style={{ color: 'var(--primary-green)', flex: 1 }}>
            Formulário de Coleta de Atendimentos
          </h1>
          <button type="button" onClick={() => window.print()} className="btn no-print" style={{ backgroundColor: '#4b5563', padding: '0.5rem 1rem', width: 'auto' }}>
            🖨️ Imprimir
          </button>
        </div>

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
          <div className="grid-2-col">
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

          <h3 className="mt-4 mb-4" style={{ textAlign: 'center', backgroundColor: '#e0f2f1', color: 'var(--primary-green)', padding: '0.5rem', borderRadius: '8px' }}>
            Atendimentos Separados
          </h3>

          <table className="premium-table quantities-table mb-4">
            <tbody>
              <tr>
                <td>Judicial</td>
                <td>
                  <input 
                    type="number" 
                    min="0"
                    name="judicial" 
                    className="form-input" 
                    value={formData.judicial || ''} 
                    onChange={handleInputChange} 
                  />
                </td>
              </tr>
              <tr>
                <td>Administrativo</td>
                <td>
                  <input 
                    type="number" 
                    min="0"
                    name="administrativo" 
                    className="form-input" 
                    value={formData.administrativo || ''} 
                    onChange={handleInputChange} 
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="mt-4 mb-4" style={{ textAlign: 'center', backgroundColor: '#fff3e0', color: '#e65100', padding: '0.5rem', borderRadius: '8px' }}>
            Parceiros (Opcional)
          </h3>

          <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid #ffd54f' }}>
            {formData.parceiros.map((parceiro, index) => (
              <div key={index} style={{ marginBottom: index !== formData.parceiros.length - 1 ? '1.5rem' : '0', paddingBottom: index !== formData.parceiros.length - 1 ? '1.5rem' : '0', borderBottom: index !== formData.parceiros.length - 1 ? '1px dashed #ffd54f' : 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }} className="grid-2-col">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nome do Parceiro {index + 1}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={parceiro.nome} 
                      onChange={(e) => handleParceiroChange(index, 'nome', e.target.value)} 
                      placeholder="Ex: Tribunal de Justiça"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Quantidade</label>
                    <input 
                      type="number" 
                      min="0"
                      className="form-input" 
                      value={parceiro.quantidade || ''} 
                      onChange={(e) => handleParceiroChange(index, 'quantidade', e.target.value)} 
                    />
                  </div>
                </div>
                {formData.parceiros.length > 1 && (
                  <button type="button" onClick={() => handleRemoveParceiro(index)} style={{ marginTop: '0.5rem', color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                    Remover Parceiro
                  </button>
                )}
              </div>
            ))}
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button type="button" onClick={handleAddParceiro} className="btn" style={{ backgroundColor: '#fff3e0', color: '#e65100', border: '1px solid #ffd54f' }}>
                + Adicionar Outro Parceiro
              </button>
            </div>
          </div>

          <div className="total-display" style={{ backgroundColor: '#f3f4f6', borderColor: '#9ca3af', color: '#374151', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.5rem' }}>
            SOMATÓRIO GERAL (Tudo): {totalGeral}
          </div>

          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? 'Salvando...' : 'Registrar Coleta'}
          </button>
        </form>
      </div>
    </div>
  );
}
