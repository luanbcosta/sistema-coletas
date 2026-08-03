'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import ColetaForm from '../../components/ColetaForm';

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
  const [selectedColeta, setSelectedColeta] = useState(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coletas');
      if (!res.ok) throw new Error('Falha ao carregar dados');
      const data = await res.json();
      setColetas(data);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta coleta? Essa ação não pode ser desfeita.')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/coletas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      
      // Refresh list
      await fetchDados();
      setSelectedColeta(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    fetchDados();
    setSelectedColeta(null);
    setIsEditingMode(false);
  };

  const totalGeral = coletas.reduce((sum, c) => sum + c.total, 0);

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

  const chartData = [
    { name: 'Judicial', value: breakdown.judicial, color: '#f59e0b' },
    { name: 'Administrativo', value: breakdown.administrativo, color: '#f59e0b' },
    ...atendimentosTipos.map(t => ({
      name: t.label,
      value: breakdown[t.id],
      color: '#10b981'
    })).filter(d => d.value > 0),
    { name: 'Parceiros', value: breakdown.parceiros, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  const getParceiros = (coleta) => {
    if (!coleta.parceiros_dados) return [];
    try {
      return JSON.parse(coleta.parceiros_dados);
    } catch {
      return [];
    }
  };

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
          <div className="glass-card mb-4">
            <h3 style={{ color: 'var(--primary-blue)', marginBottom: '1rem' }}>Visão Analítica (Gráfico)</h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0}
                    tick={{ fontSize: 11 }}
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="mb-0">Histórico de Coletas</h2>
            <p className="text-light" style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>Clique em uma linha para ver os detalhes daquela coleta</p>
          </div>
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
                  <th>Total Somado</th>
                </tr>
              </thead>
              <tbody>
                {coletas.map(coleta => (
                  <tr key={coleta.id} className="clickable-row" onClick={() => { setSelectedColeta(coleta); setIsEditingMode(false); }}>
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

      {selectedColeta && (
        <div className="modal-overlay" onClick={() => setSelectedColeta(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedColeta(null)}>&times;</button>
            
            {isEditingMode ? (
              <>
                <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1.5rem' }}>Editar Coleta</h2>
                <ColetaForm initialData={selectedColeta} onSuccess={handleEditSuccess} />
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button onClick={() => setIsEditingMode(false)} style={{ background: 'none', border: 'none', color: '#6b7280', textDecoration: 'underline', cursor: 'pointer' }}>
                    Cancelar Edição
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h2 style={{ color: 'var(--primary-blue)', margin: 0 }}>Detalhes da Coleta</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setIsEditingMode(true)} className="btn" style={{ backgroundColor: '#f59e0b', padding: '0.4rem 0.8rem', width: 'auto', fontSize: '0.9rem' }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDelete(selectedColeta.id)} disabled={deleting} className="btn" style={{ backgroundColor: '#ef4444', padding: '0.4rem 0.8rem', width: 'auto', fontSize: '0.9rem' }}>
                      {deleting ? '...' : '🗑️ Excluir'}
                    </button>
                  </div>
                </div>
                
                <p className="text-light" style={{ marginBottom: '1.5rem' }}>
                  Data: {new Date(selectedColeta.data_coleta).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <strong>Ação Social:</strong>
                    <div>{selectedColeta.acao_social || '-'}</div>
                  </div>
                  <div>
                    <strong>Responsável:</strong>
                    <div>{selectedColeta.responsavel || '-'}</div>
                  </div>
                </div>

                <h4 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Quantitativos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                    <span>Judicial:</span>
                    <strong>{selectedColeta.judicial || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                    <span>Administrativo:</span>
                    <strong>{selectedColeta.administrativo || 0}</strong>
                  </div>
                  
                  {atendimentosTipos.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t.label}:</span>
                      <strong>{selectedColeta[t.id] || 0}</strong>
                    </div>
                  ))}
                </div>

                {getParceiros(selectedColeta).length > 0 && (
                  <>
                    <h4 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}>Parceiros Envolvidos</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                      {getParceiros(selectedColeta).map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '4px' }}>
                          <span>{p.nome || 'Sem Nome'}</span>
                          <strong style={{ color: 'var(--primary-blue)' }}>{p.quantidade || 0}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                  <button className="btn" style={{ width: 'auto', backgroundColor: '#4b5563' }} onClick={() => setSelectedColeta(null)}>
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
