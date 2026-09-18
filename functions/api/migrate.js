export async function GET(context) {
  try {
    await context.env.DB.prepare("ALTER TABLE coletas ADD COLUMN acao_finalizada INTEGER DEFAULT 0;").run();
    return Response.json({ success: true, message: "Migration applied successfully" });
  } catch(e) {
    return Response.json({ error: e.message });
  }
}
