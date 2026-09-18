export async function onRequestDelete(context) {
  try {
    const { request, env } = context;
    const { acao_social } = await request.json();
    
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "Banco de dados D1 não encontrado." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await env.DB.prepare('DELETE FROM coletas WHERE acao_social = ?')
      .bind(acao_social)
      .run();

    return new Response(JSON.stringify({ success: true, meta: result.meta }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
