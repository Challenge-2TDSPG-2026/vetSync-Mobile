const TEMPO_LIMITE_MS = 10000;
const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = String(leitor.result);
      const indice = resultado.indexOf(',');
      if (indice < 0) reject(new Error('Foto inválida.'));
      else resolve(resultado.slice(indice + 1));
    };
    leitor.onerror = () => reject(new Error('Falha ao ler a foto.'));
    leitor.readAsDataURL(blob);
  });
}

/**
 * Baixa a foto do pet (endpoint autenticado, o mesmo usado pelo PetFoto) e devolve como data URI,
 * pois o PDF é gerado sem acesso à sessão do app. Devolve null se não houver foto ou se falhar:
 * o PDF então usa a inicial do nome no lugar.
 */
export async function carregarFotoPetPdf(fotoUrl?: string | null, token?: string | null): Promise<string | null> {
  if (!fotoUrl || !token) return null;
  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(fotoUrl, { headers: { Authorization: `Bearer ${token}` }, signal: controlador.signal });
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    const tipoHeader = (resposta.headers.get('content-type') ?? blob.type ?? '').split(';')[0].trim().toLowerCase();
    const tipo = TIPOS_ACEITOS.includes(tipoHeader) ? tipoHeader : 'image/jpeg';
    return `data:${tipo};base64,${await blobParaBase64(blob)}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}