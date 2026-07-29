DROP TABLE IF EXISTS coletas;
CREATE TABLE coletas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  acao_social TEXT NOT NULL,
  data_coleta TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  judicial INTEGER DEFAULT 0,
  administrativo INTEGER DEFAULT 0,
  orientacao_consulta INTEGER DEFAULT 0,
  acordos INTEGER DEFAULT 0,
  segunda_via INTEGER DEFAULT 0,
  retificacao INTEGER DEFAULT 0,
  restauracao INTEGER DEFAULT 0,
  registro_tardio INTEGER DEFAULT 0,
  reconhecimento_paternidade INTEGER DEFAULT 0,
  demandas_familia INTEGER DEFAULT 0,
  outras_demandas INTEGER DEFAULT 0,
  parceiro_nome TEXT,
  parceiro_quantidade INTEGER DEFAULT 0,
  parceiros_dados TEXT,
  total INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
