'use client';

import { useState, useMemo, useEffect } from 'react';

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

const getInitialState = () => ({
  acao_social: '',
  data_coleta: new Date().toISOString().split('T')[0],
  responsavel: '',
  judicial: 0,
  administrativo: 0,
  orientacao_consulta: 0,
  acordos: 0,
  segunda_via: 0,
  retificacao: 0,
  restauracao: 0,
  registro_tardio: 0,
  reconhecimento_paternidade: 0,
  demandas_familia: 0,
  outras_demandas: 0,
  parceiros: [{ nome: '', quantidade: 0 }]
});

export default function ColetaForm({ initialData = null, onSuccess }) {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      const data = { ...initialData };
      if (data.data_coleta) {
        data.data_coleta = new Date(data.data_coleta).toISOString().split('T')[0];
      }
      if (typeof data.parceiros_dados === 'string') {
        try {
          data.parceiros = JSON.parse(data.parceiros_dados);
        } catch {
          data.parceiros = [{ nome: '', quantidade: 0 }];
        }
      }
      if (!data.parceiros || data.parceiros.length === 0) {
        data.parceiros = [{ nome: '', quantidade: 0 }];
      }
      return data;
    }
    return getInitialState();
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [uniqueAcoes, setUniqueAcoes] = useState([]);

  useEffect(() => {
    // Fetch distinct actions for autocomplete
    const fetchAcoes = async () => {
      try {
        const res = await fetch('/api/coletas');
        if (res.ok) {
          const data = await res.json();
          // Group by acao_social to get distinct and their responsavel
          const acoesMap = {};
          data.forEach(c => {
             if (!acoesMap[c.acao_social]) {
                acoesMap[c.acao_social] = c.responsavel;
             }
          });
          const list = Object.keys(acoesMap).map(k => ({ acao: k, resp: acoesMap[k] }));
          setUniqueAcoes(list);
        }
      } catch (e) {
        console.error('Failed to load acoes', e);
      }
    };
    fetchAcoes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let updates = { [name]: type === 'number' ? (parseInt(value) || 0) : value };

    // Auto-fill responsavel if acao_social matches
    if (name === 'acao_social') {
      const match = uniqueAcoes.find(a => a.acao.toLowerCase() === value.toLowerCase());
      if (match && !formData.responsavel) {
        updates.responsavel = match.resp;
      }
    }

    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const total = useMemo(() => {
    return atendimentosTipos.reduce((acc, tipo) => acc + (parseInt(formData[tipo.id]) || 0), 0);
  }, [formData]);

  const totalGeral = useMemo(() => {
    const parceirosTotal = formData.parceiros.reduce((sum, p) => sum + (parseInt(p.quantidade) || 0), 0);
    return total + parceirosTotal;
  }, [total, formData.parceiros]);

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
      const url = isEditing ? `/api/coletas/${initialData.id}` : '/api/coletas';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com o servidor');
      }

      setMessage({ type: 'success', text: isEditing ? 'Atualizado com sucesso!' : 'Parcial registrada com sucesso!' });
      
      if (!isEditing) {
        // Keep the acao and responsavel, but reset the rest to make adding another day easy
        setFormData(prev => ({
          ...getInitialState(),
          acao_social: prev.acao_social,
          responsavel: prev.responsavel,
          data_coleta: new Date().toISOString().split('T')[0] // today
        }));
      }

      if (onSuccess) onSuccess();

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card fade-in">
      {message && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
        }}>
          {message.text}
        </div>
      )}

      <div className="form-group">
        <label>Ação Social</label>
        <input
          type="text"
          name="acao_social"
          value={formData.acao_social}
          onChange={handleInputChange}
          required
          placeholder="Nome da Ação"
          className="form-control"
          list="acoes-list"
        />
        <datalist id="acoes-list">
          {uniqueAcoes.map((a, i) => <option key={i} value={a.acao} />)}
        </datalist>
      </div>

      <div className="form-group">
        <label>Data desta Parcial</label>
        <input
          type="date"
          name="data_coleta"
          value={formData.data_coleta}
          onChange={handleInputChange}
          required
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>Responsável pela Coleta</label>
        <input
          type="text"
          name="responsavel"
          value={formData.responsavel}
          onChange={handleInputChange}
          required
          placeholder="Nome do Responsável"
          className="form-control"
        />
      </div>

      <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--primary-blue)', textAlign: 'center' }}>
        Número de Atendimentos deste Dia
      </h3>

      <div className="form-grid">
        <div className="form-group">
          <label>Judicial</label>
          <input
            type="number"
            name="judicial"
            min="0"
            value={formData.judicial}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label>Administrativo</label>
          <input
            type="number"
            name="administrativo"
            min="0"
            value={formData.administrativo}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>

        {atendimentosTipos.map((tipo) => (
          <div key={tipo.id} className="form-group">
            <label>{tipo.label}</label>
            <input
              type="number"
              name={tipo.id}
              min="0"
              value={formData[tipo.id]}
              onChange={handleInputChange}
              className="form-control"
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', borderTop: '2px dashed #e5e7eb', paddingTop: '2rem' }}>
        <h3 style={{ color: 'var(--primary-green)', textAlign: 'center', marginBottom: '1rem' }}>
          Parceiros (Opcional)
        </h3>
        
        {formData.parceiros.map((parceiro, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Nome do Parceiro {index + 1}</label>
              <input
                type="text"
                value={parceiro.nome}
                onChange={(e) => handleParceiroChange(index, 'nome', e.target.value)}
                placeholder="Ex: Equatorial"
                className="form-control"
              />
              {formData.parceiros.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveParceiro(index)}
                  style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem', padding: 0 }}
                >
                  Remover Parceiro
                </button>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Quantidade</label>
              <input
                type="number"
                min="0"
                value={parceiro.quantidade}
                onChange={(e) => handleParceiroChange(index, 'quantidade', e.target.value)}
                className="form-control"
              />
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button 
            type="button" 
            onClick={handleAddParceiro}
            style={{ background: 'none', border: '2px solid #f59e0b', color: '#f59e0b', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            + Adicionar Outro Parceiro
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '2px solid #e2e8f0', textAlign: 'center' }}>
        <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>SOMATÓRIO DESTE DIA: {totalGeral}</h3>
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '2rem' }}>
        {loading ? 'Salvando...' : (isEditing ? 'Atualizar Parcial' : 'Registrar Parcial do Dia')}
      </button>
    </form>
  );
}
