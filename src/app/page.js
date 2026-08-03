'use client';

import ColetaForm from '../components/ColetaForm';

export default function Home() {
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

        <ColetaForm />
      </div>
    </div>
  );
}
