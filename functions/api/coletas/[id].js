export async function onRequestDelete(context) {
  try {
    const { env, params } = context;
    const id = params.id;
    
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "Banco de dados D1 não encontrado." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const result = await env.DB.prepare('DELETE FROM coletas WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true, meta: result.meta }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPut(context) {
  try {
    const { request, env, params } = context;
    const id = params.id;
    const data = await request.json();
    
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "Banco de dados D1 não encontrado." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const stmt = env.DB.prepare(`
      UPDATE coletas SET
        acao_social = ?, data_coleta = ?, responsavel = ?, judicial = ?, administrativo = ?, 
        orientacao_consulta = ?, acordos = ?, segunda_via = ?, retificacao = ?, restauracao = ?, 
        registro_tardio = ?, reconhecimento_paternidade = ?, demandas_familia = ?, 
        outras_demandas = ?, parceiro_nome = ?, parceiro_quantidade = ?, parceiros_dados = ?, total = ?
      WHERE id = ?
    `).bind(
      data.acao_social, data.data_coleta, data.responsavel,
      data.judicial || 0, data.administrativo || 0, data.orientacao_consulta || 0,
      data.acordos || 0, data.segunda_via || 0, data.retificacao || 0,
      data.restauracao || 0, data.registro_tardio || 0, data.reconhecimento_paternidade || 0,
      data.demandas_familia || 0, data.outras_demandas || 0, 
      data.parceiro_nome || '', data.parceiro_quantidade || 0, 
      JSON.stringify(data.parceiros || []), data.total || 0,
      id
    );

    const result = await stmt.run();

    return new Response(JSON.stringify({ success: true, meta: result.meta }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
