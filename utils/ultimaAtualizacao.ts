const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

/** "13/10/2026 às 14:05" (horário local do aparelho). */
export function formatarDataHoraCurta(timestamp: number): string {
  const d = new Date(timestamp);
  return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()} às ${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
}

/** "agora há pouco", "há 5 min", "há 3 h", "há 2 dias". */
export function formatarTempoDecorrido(timestamp: number, agora: number = Date.now()): string {
  const diff = Math.max(0, agora - timestamp);
  if (diff < MINUTO) return 'agora há pouco';
  if (diff < HORA) return `há ${Math.floor(diff / MINUTO)} min`;
  if (diff < DIA) return `há ${Math.floor(diff / HORA)} h`;
  const dias = Math.floor(diff / DIA);
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

/** Texto único para a interface: "Atualizado há 3 h (13/10/2026 às 14:05)". */
export function textoUltimaAtualizacao(timestamp: number, agora: number = Date.now()): string {
  return `Atualizado ${formatarTempoDecorrido(timestamp, agora)} (${formatarDataHoraCurta(timestamp)})`;
}

/** A parte mais antiga (menor timestamp) vale para o conjunto; ignora consultas que nunca carregaram (0). */
export function atualizacaoMaisAntiga(timestamps: number[]): number | null {
  const validos = timestamps.filter((t) => t > 0);
  return validos.length === 0 ? null : Math.min(...validos);
}
