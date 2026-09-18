'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [acoesAgrupadas, setAcoesAgrupadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAcao, setSelectedAcao] = useState(null); // The grouped action being viewed
  const [selectedParcial, setSelectedParcial] = useState(null); // A specific day's partial being viewed/edited
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customAlert, setCustomAlert] = useState(null);
  const fileInputRef = useRef(null);

  const fetchDados = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coletas');
      if (!res.ok) throw new Error('Falha ao carregar dados');
      const data = await res.json();
      setColetas(data);
      
      // Agrupar por acao_social
      const grupos = {};
      data.forEach(c => {
         const key = c.acao_social;
         if(!grupos[key]) {
            grupos[key] = {
               acao_social: key,
               is_finalizada: false,
               responsavel: c.responsavel,
               dias: [],
               total: 0
            };
         }
         grupos[key].dias.push(c);
         if (c.is_finalizada === 1) grupos[key].is_finalizada = true;
         grupos[key].total += c.total;
      });
      // Order groups by latest date of its partials
      const groupedArray = Object.values(grupos).map(g => {
         g.dias.sort((a,b) => new Date(b.data_coleta) - new Date(a.data_coleta));
         g.ultima_data = g.dias[0].data_coleta;
         return g;
      });
      groupedArray.sort((a,b) => new Date(b.ultima_data) - new Date(a.ultima_data));
      setAcoesAgrupadas(groupedArray);

      // Refresh selected action if it was open
      if(selectedAcao) {
         const updatedAcao = groupedArray.find(a => a.acao_social === selectedAcao.acao_social);
         if(updatedAcao) setSelectedAcao(updatedAcao);
         else setSelectedAcao(null); // was deleted completely
      }

    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const handleDeleteParcial = async (id) => {
    setCustomAlert({
      type: 'confirm',
      title: 'Excluir Registro',
      message: 'Tem certeza que deseja excluir o registro deste dia? Essa ação não pode ser desfeita.',
      onConfirm: async () => {
        setCustomAlert(null);
        setDeleting(true);
        try {
          const res = await fetch(`/api/coletas/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Falha ao excluir');
          await fetchDados();
          setSelectedParcial(null);
        } catch (err) {
          setCustomAlert({ type: 'alert', title: 'Erro', message: err.message });
        } finally {
          setDeleting(false);
        }
      }
    });
  };

  const handleFinalizarAcao = async (acao_social) => {
    setCustomAlert({
      type: 'confirm',
      title: 'Encerrar Ação',
      message: `Tem certeza que deseja encerrar a ação "${acao_social}"? Ela não aparecerá mais no formulário para novos registros.`,
      onConfirm: async () => {
        setCustomAlert(null);
        try {
            const res = await fetch('/api/coletas/finalizar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acao_social })
            });
            if (!res.ok) throw new Error('Falha ao encerrar a ação');
            setCustomAlert({ type: 'alert', title: 'Sucesso', message: 'Ação encerrada com sucesso!' });
            fetchDados();
            setSelectedAcao(null);
        } catch (err) {
            setCustomAlert({ type: 'alert', title: 'Erro', message: err.message });
        }
      }
    });
  };

  const handleExcluirAcao = async (acao_social) => {
    setCustomAlert({
      type: 'confirm',
      title: 'Excluir Ação Inteira',
      message: `Tem certeza que deseja excluir completamente a ação "${acao_social}" E todos os seus dias registrados? Essa operação NÃO pode ser desfeita.`,
      onConfirm: async () => {
        setCustomAlert(null);
        try {
            const res = await fetch('/api/acoes/excluir', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acao_social })
            });
            if (!res.ok) throw new Error('Falha ao excluir a ação');
            setCustomAlert({ type: 'alert', title: 'Sucesso', message: 'Ação inteira e seus dias foram excluídos!' });
            fetchDados();
            setSelectedAcao(null);
        } catch (err) {
            setCustomAlert({ type: 'alert', title: 'Erro', message: err.message });
        }
      }
    });
  };

  const printModal = () => {
    document.body.classList.add('printing-modal');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-modal');
    }, 500);
  };

  const handleEditSuccess = () => {
    fetchDados();
    setSelectedParcial(null);
    setIsEditingMode(false);
    setIsAddingMode(false);
  };

  const handleExportBackup = () => {
    try {
      const backupData = JSON.stringify(coletas, null, 2);
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_coletas_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setCustomAlert({ type: 'alert', title: 'Erro', message: 'Erro ao gerar backup: ' + err.message });
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) throw new Error("Formato inválido. O arquivo deve conter uma lista de coletas.");
        
        setCustomAlert({
          type: 'confirm',
          title: 'Restaurar Backup',
          message: `Você está prestes a restaurar ${data.length} coletas. Para evitar dados duplicados, importe apenas se o sistema estiver vazio ou dados estiverem faltando. Continuar?`,
          onConfirm: async () => {
            setCustomAlert(null);
            setLoading(true);
            let restoredCount = 0;
            try {
              for (const item of data) {
                const { id, created_at, ...payload } = item;
                if (payload.parceiros_dados) {
                   try { payload.parceiros = JSON.parse(payload.parceiros_dados); } 
                   catch(err) { payload.parceiros = []; }
                } else {
                   payload.parceiros = [];
                }
                
                const res = await fetch('/api/coletas', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                if(res.ok) restoredCount++;
              }
              setCustomAlert({ type: 'alert', title: 'Sucesso', message: `Restauração concluída! ${restoredCount} parciais importadas.` });
              fetchDados();
            } catch (err) {
              setCustomAlert({ type: 'alert', title: 'Erro', message: 'Erro ao importar backup: ' + err.message });
            } finally {
              setLoading(false);
            }
          }
        });
      } catch (err) {
        setCustomAlert({ type: 'alert', title: 'Erro', message: 'Erro ao ler arquivo: ' + err.message });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
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
            <h2 className="mb-0">Ações Sociais Registradas</h2>
            <p className="text-light" style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>Clique em uma Ação para ver os dias registrados</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }} className="no-print">
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              ref={fileInputRef} 
              onChange={handleImportBackup} 
            />
            <button onClick={() => fileInputRef.current.click()} className="btn" style={{ backgroundColor: '#f59e0b', padding: '0.5rem 1rem', width: 'auto' }}>
              ⬆️ Restaurar Backup
            </button>
            <button onClick={handleExportBackup} className="btn" style={{ backgroundColor: '#10b981', padding: '0.5rem 1rem', width: 'auto' }}>
              📥 Salvar Backup
            </button>
            <button onClick={() => window.print()} className="btn" style={{ backgroundColor: '#4b5563', padding: '0.5rem 1rem', width: 'auto' }}>
              🖨️ Imprimir
            </button>
          </div>
        </div>
        
        {loading ? (
          <p className="text-center text-light">Carregando...</p>
        ) : acoesAgrupadas.length === 0 ? (
          <p className="text-center text-light">Nenhuma coleta registrada ainda.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Ação Social</th>
                  <th>Responsável</th>
                  <th>Dias Registrados</th>
                  <th>Total Somado</th>
                </tr>
              </thead>
              <tbody>
                {acoesAgrupadas.map((acao, idx) => (
                  <tr key={idx} className="clickable-row" onClick={() => { setSelectedAcao(acao); }}>
                    <td>
                      {acao.acao_social}
                      {acao.is_finalizada && <span style={{backgroundColor: "#ef4444", color: "white", padding: "0.2rem 0.5rem", borderRadius: "12px", fontSize: "0.7rem", marginLeft: "0.5rem", fontWeight: "bold"}}>ENCERRADA</span>}
                    </td>
                    <td>{acao.responsavel}</td>
                    <td>{acao.dias.length} dia(s)</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary-green)' }}>
                      {acao.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Resumo da Ação e Lista de Dias */}
      {selectedAcao && !selectedParcial && !isAddingMode && (
        <div className="modal-overlay" onClick={() => setSelectedAcao(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedAcao(null)}>&times;</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ color: 'var(--primary-blue)', margin: 0, display: 'flex', alignItems: 'center' }}>
                Resumo da Ação
                {selectedAcao.is_finalizada && <span style={{backgroundColor: "#ef4444", color: "white", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.8rem", marginLeft: "0.5rem", letterSpacing: '0.05em'}}>ENCERRADA</span>}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }} className="no-print">
                <button className="btn" style={{ backgroundColor: '#dc2626', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleExcluirAcao(selectedAcao.acao_social)}>
                  Excluir Ação
                </button>
                {!selectedAcao.is_finalizada && (
                  <button className="btn" style={{ backgroundColor: '#f59e0b', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleFinalizarAcao(selectedAcao.acao_social)}>
                    Encerrar Ação
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#64748b' }}>Ação Social:</strong>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedAcao.acao_social}</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#64748b' }}>Responsável:</strong>
                <span style={{ fontSize: '1.1rem' }}>{selectedAcao.responsavel}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, color: 'var(--text-dark)' }}>Parciais (Dias Registrados)</h4>
              {!selectedAcao.is_finalizada && (
                <button onClick={() => setIsAddingMode(true)} className="btn no-print" style={{ backgroundColor: '#10b981', padding: '0.4rem 0.8rem', width: 'auto', fontSize: '0.9rem' }}>
                  + Adicionar Novo Dia
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
               {selectedAcao.dias.map(dia => (
                  <div key={dia.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                     <div>
                        <strong style={{ color: 'var(--primary-blue)' }}>{new Date(dia.data_coleta).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</strong>
                        <span style={{ marginLeft: '1rem', color: '#64748b' }}>Atendimentos: <strong style={{color: 'var(--text-dark)'}}>{dia.total}</strong></span>
                     </div>
                     <button onClick={() => setSelectedParcial(dia)} className="btn no-print" style={{ backgroundColor: '#3b82f6', padding: '0.3rem 0.8rem', width: 'auto', fontSize: '0.85rem' }}>
                        Ver Parcial
                     </button>
                  </div>
               ))}
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e0f2f1', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: 'var(--primary-green)', fontSize: '1.1rem' }}>Total Somado da Ação:</strong>
              <strong style={{ color: 'var(--primary-blue)', fontSize: '1.5rem' }}>{selectedAcao.total}</strong>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'right' }} className="no-print">
               <button className="btn" style={{ width: 'auto', backgroundColor: '#4b5563' }} onClick={() => setSelectedAcao(null)}>
                 Fechar
               </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal - Adicionar Parcial Específica */}
      {isAddingMode && selectedAcao && (
         <div className="modal-overlay" onClick={() => setIsAddingMode(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
               <button className="modal-close" onClick={() => setIsAddingMode(false)}>&times;</button>
               <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1.5rem' }}>Adicionar Parcial: {selectedAcao.acao_social}</h2>
               <ColetaForm 
                  onSuccess={handleEditSuccess} 
                  initialData={{
                     acao_social: selectedAcao.acao_social,
                     responsavel: selectedAcao.responsavel,
                     data_coleta: new Date().toISOString().split('T')[0],
                     // Empty fields for the new partial
                     judicial: 0, administrativo: 0, orientacao_consulta: 0, acordos: 0,
                     segunda_via: 0, retificacao: 0, restauracao: 0, registro_tardio: 0,
                     reconhecimento_paternidade: 0, demandas_familia: 0, outras_demandas: 0,
                     parceiros: []
                  }} 
               />
               <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button onClick={() => setIsAddingMode(false)} style={{ background: 'none', border: 'none', color: '#6b7280', textDecoration: 'underline', cursor: 'pointer' }}>
                     Cancelar
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Modal - Detalhes/Edição da Parcial */}
      {selectedParcial && (
        <div className="modal-overlay" onClick={() => { setSelectedParcial(null); setIsEditingMode(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setSelectedParcial(null); setIsEditingMode(false); }}>&times;</button>
            
            {isEditingMode ? (
              <>
                <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1.5rem' }}>Editar Parcial do Dia</h2>
                <ColetaForm initialData={selectedParcial} onSuccess={handleEditSuccess} />
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button onClick={() => setIsEditingMode(false)} style={{ background: 'none', border: 'none', color: '#6b7280', textDecoration: 'underline', cursor: 'pointer' }}>
                    Cancelar Edição
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h2 style={{ color: 'var(--primary-blue)', margin: 0 }}>Detalhes da Parcial</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }} className="no-print">
                    <button onClick={printModal} className="btn" style={{ backgroundColor: '#10b981', padding: '0.4rem 0.8rem', width: 'auto', fontSize: '0.9rem' }}>
                      🖨️ PDF
                    </button>
                    <button onClick={() => setIsEditingMode(true)} className="btn" style={{ backgroundColor: '#f59e0b', padding: '0.4rem 0.8rem', width: 'auto', fontSize: '0.9rem' }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => handleDeleteParcial(selectedParcial.id)} disabled={deleting} className="btn" style={{ backgroundColor: '#ef4444', padding: '0.4rem 0.8rem', width: 'auto', fontSize: '0.9rem' }}>
                      {deleting ? '...' : '🗑️ Excluir'}
                    </button>
                  </div>
                </div>
                
                <p className="text-light" style={{ marginBottom: '1.5rem' }}>
                  Data desta Parcial: {new Date(selectedParcial.data_coleta).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <strong>Ação Social:</strong>
                    <div>{selectedParcial.acao_social || '-'}</div>
                  </div>
                  <div>
                    <strong>Responsável:</strong>
                    <div>{selectedParcial.responsavel || '-'}</div>
                  </div>
                </div>

                <h4 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Quantitativos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                    <span>Judicial:</span>
                    <strong>{selectedParcial.judicial || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                    <span>Administrativo:</span>
                    <strong>{selectedParcial.administrativo || 0}</strong>
                  </div>
                  
                  {atendimentosTipos.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t.label}:</span>
                      <strong>{selectedParcial[t.id] || 0}</strong>
                    </div>
                  ))}
                </div>

                {getParceiros(selectedParcial).length > 0 && (
                  <>
                    <h4 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}>Parceiros Envolvidos</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                      {getParceiros(selectedParcial).map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '4px' }}>
                          <span>{p.nome || 'Sem Nome'}</span>
                          <strong style={{ color: 'var(--primary-blue)' }}>{p.quantidade || 0}</strong>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e0f2f1', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--primary-green)', fontSize: '1.1rem' }}>Total Deste Dia:</strong>
                  <strong style={{ color: 'var(--primary-blue)', fontSize: '1.3rem' }}>{selectedParcial.total}</strong>
                </div>
                
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }} className="no-print">
                  <button className="btn" style={{ width: 'auto', backgroundColor: '#64748b', padding: '0.4rem 1rem' }} onClick={() => { setSelectedParcial(null); setIsEditingMode(false); }}>
                    ← Voltar p/ Ação
                  </button>
                  <button className="btn" style={{ width: 'auto', backgroundColor: '#4b5563', padding: '0.4rem 1rem' }} onClick={() => { setSelectedParcial(null); setSelectedAcao(null); }}>
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {customAlert && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ color: customAlert.title === 'Erro' ? '#ef4444' : 'var(--primary-blue)', marginBottom: '1rem' }}>
              {customAlert.title}
            </h3>
            <p style={{ marginBottom: '2rem', color: '#475569' }}>{customAlert.message}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              {customAlert.type === 'confirm' && (
                <button 
                  className="btn" 
                  style={{ backgroundColor: '#64748b' }} 
                  onClick={() => setCustomAlert(null)}
                >
                  Cancelar
                </button>
              )}
              <button 
                className="btn btn-success" 
                style={{ backgroundColor: customAlert.type === 'confirm' ? '#ef4444' : '#10b981', margin: 0, width: 'auto' }} 
                onClick={() => {
                  if (customAlert.type === 'confirm') {
                    customAlert.onConfirm();
                  } else {
                    setCustomAlert(null);
                  }
                }}
              >
                {customAlert.type === 'confirm' ? 'Confirmar' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
