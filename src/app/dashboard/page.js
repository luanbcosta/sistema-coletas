'use client';

import { useState, useEffect } from 'react';

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

export default function Dashboard() {
  const [coletas, setColetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/coletas');
        if (!res.ok) throw new Error('Falha ao carregar dados');
        const data = await res.json();
        setColetas(data);
      } catch (err) {
        setError('Erro ao carregar dados: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalGeral = coletas.reduce((sum, c) => sum + c.total, 0);

  // Calcula o somatório detalhado
  const breakdown = coletas.reduce((acc, c) => {
    acc.judicial = (acc.judicial || 0) + (c.judicial || 0);
    acc.administrativo = (acc.administrativo || 0) + (c.administrativo || 0);
    
    atendimentosTipos.forEach(tipo => {
      acc[tipo.id] = (acc[tipo.id] || 0) + (c[tipo.id] || 0);
    });

    let parceirosSum = 0;
    if (c.parceiros_dados) {
      try {
        const pArr = JSON.parse(c.parceiros_dados);
        parceirosSum = pArr.reduce((sum, p) => sum + (parseInt(p.quantidade) || 0), 0);
      } catch (e) {}
    }
    acc.parceiros = (acc.parceiros || 0) + parceirosSum;

    return acc;
  }, {});

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="glass-card mb-4" style={{ textAlign: 'center', backgroundColor: '#e0f2f1' }}>
        <h2 style={{ color: 'var(--primary-green)', marginBottom: '0.5rem' }}>Total Geral de Atendimentos</h2>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
          {loading ? '...' : totalGeral}
        </div>
      </div>

      {!loading && coletas.length > 0 && (
        <div className="mb-4">
          <h3 style={{ color: 'var(--primary-blue)', marginBottom: '1rem' }}>Detalhamento por Tipo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Judicial</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{breakdown.judicial}</div>
            </div>
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Administrativo</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{breakdown.administrativo}</div>
            </div>
            {atendimentosTipos.map(tipo => (
              <div key={tipo.id} className="glass-card" style={{ padding: '1rem', textAlign: 'center', borderLeft: '4px solid var(--primary-green)' }}>
                <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>{tipo.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{breakdown[tipo.id]}</div>
              </div>
            ))}
            <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Parceiros</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{breakdown.parceiros}</div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="mb-0">Histórico de Coletas</h2>
          <button onClick={() => window.print()} className="btn no-print" style={{ backgroundColor: '#4b5563', padding: '0.5rem 1rem', width: 'auto' }}>
            🖨️ Imprimir Relatório
          </button>
        </div>
        
        {loading ? (
          <p className="text-center text-light">Carregando...</p>
        ) : coletas.length === 0 ? (
          <p className="text-center text-light">Nenhuma coleta registrada ainda.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Ação Social</th>
                  <th>Responsável</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {coletas.map(coleta => (
                  <tr key={coleta.id}>
                    <td>
                      {new Date(coleta.data_coleta).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td>{coleta.acao_social}</td>
                    <td>{coleta.responsavel}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary-green)' }}>
                      {coleta.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
