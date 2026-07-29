'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [coletas, setColetas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchColetas() {
      try {
        const res = await fetch('/api/coletas');
        const data = await res.json();
        if (Array.isArray(data)) {
          setColetas(data);
        }
      } catch (err) {
        console.error('Error fetching coletas', err);
      } finally {
        setLoading(false);
      }
    }
    fetchColetas();
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
        <h2 className="mb-4">Histórico de Coletas</h2>
        
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
