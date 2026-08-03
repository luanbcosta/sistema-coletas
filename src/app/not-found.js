export const runtime = 'edge';

export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Página não encontrada</h2>
      <p>A página que você tentou acessar não existe.</p>
    </div>
  );
}
