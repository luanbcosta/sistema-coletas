'use client';

import { useState, useEffect } from 'react';

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

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="glass-card mb-4" style={{ textAlign: 'center', backgroundColor: '#e0f2f1' }}>
        <h2 style={{ color: 'var(--primary-green)', marginBottom: '0.5rem' }}>Total Geral de Atendimentos</h2>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
          {loading ? '...' : totalGeral}
        </div>
      </div>

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
