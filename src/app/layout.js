import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Registro de Coletas - Defensoria Pública',
  description: 'Sistema de coleta de atendimentos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="https://defensoria.ma.def.br/dpema/public/dpema_v2/img/logo.svg" alt="Logo Defensoria" style={{ height: '50px', objectFit: 'contain' }} />
            <h2 style={{ margin: 0, display: 'none' }}>Defensoria Pública</h2>
          </div>
          <nav>
            <Link href="/" className="nav-link">Formulário</Link>
            <Link href="/dashboard" className="nav-link">Dashboard</Link>
          </nav>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
