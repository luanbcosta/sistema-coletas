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
            <h2 style={{ margin: 0 }}>Defensoria Pública</h2>
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
