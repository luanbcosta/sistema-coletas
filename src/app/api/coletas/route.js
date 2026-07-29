import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { env } = getRequestContext();
    if (!env.DB) {
      return NextResponse.json({ error: "Banco de dados D1 não encontrado." }, { status: 500 });
    }

    const { results } = await env.DB.prepare('SELECT * FROM coletas ORDER BY created_at DESC').all();
    
    return NextResponse.json(results || []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { env } = getRequestContext();
    
    if (!env.DB) {
      return NextResponse.json({ error: "Banco de dados D1 não encontrado." }, { status: 500 });
    }

    const stmt = env.DB.prepare(`
      INSERT INTO coletas (
        acao_social, data_coleta, responsavel, judicial, administrativo, 
        orientacao_consulta, acordos, segunda_via, retificacao, restauracao, 
        registro_tardio, reconhecimento_paternidade, demandas_familia, 
        outras_demandas, parceiro_nome, parceiro_quantidade, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.acao_social, data.data_coleta, data.responsavel,
      data.judicial || 0, data.administrativo || 0, data.orientacao_consulta || 0,
      data.acordos || 0, data.segunda_via || 0, data.retificacao || 0,
      data.restauracao || 0, data.registro_tardio || 0, data.reconhecimento_paternidade || 0,
      data.demandas_familia || 0, data.outras_demandas || 0, 
      data.parceiro_nome || '', data.parceiro_quantidade || 0, data.total || 0
    );

    const result = await stmt.run();

    return NextResponse.json({ success: true, meta: result.meta });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
