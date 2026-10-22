import type { Evento } from '../types';
import { parseDataEvento } from './eventoStatus';

export interface OpcaoLembrete {
  /** Antecedência em minutos em relação ao horário do evento. */
  minutos: number;
  label: string;
}

export const MINUTOS_24_HORAS = 24 * 60;
export const MINUTOS_30_MINUTOS = 30;

/** Opções oferecidas ao tutor na hora de agendar um evento. */
export const OPCOES_LEMBRETE: OpcaoLembrete[] = [
  { minutos: MINUTOS_24_HORAS, label: '24 horas antes' },
  { minutos: MINUTOS_30_MINUTOS, label: '30 minutos antes' },
];

/** Lembretes marcados por padrão em um novo evento. */
export const LEMBRETES_PADRAO: number[] = [MINUTOS_24_HORAS, MINUTOS_30_MINUTOS];

const PADRAO_HORA = /^(\d{2}):(\d{2})/;

/**
 * Data e hora exatas do evento. A API devolve a data (`2026-10-23`) e a hora (`14:30`) separadas;
 * sem combinar as duas, o horário cairia no meio-dia e o aviso de "30 minutos antes" sairia errado.
 */
export function dataHoraDoEvento(evento: Pick<Evento, 'data' | 'hora'>): Date {
  const hora = evento.hora ? PADRAO_HORA.exec(evento.hora) : null;
  if (hora && evento.data.length === 10) {
    const combinada = new Date(`${evento.data}T${hora[1]}:${hora[2]}:00`);
    if (!Number.isNaN(combinada.getTime())) return combinada;
  }
  return parseDataEvento(evento.data);
}

/** Momento em que o lembrete deve disparar. */
export function calcularDisparoLembrete(
  evento: Pick<Evento, 'data' | 'hora'>,
  minutosAntes: number,
): Date {
  return new Date(dataHoraDoEvento(evento).getTime() - minutosAntes * 60_000);
}

function plural(valor: number, singular: string, pluralTexto: string): string {
  return `${valor} ${valor === 1 ? singular : pluralTexto}`;
}

/** "24 horas", "30 minutos", "1 hora"... */
export function descreverAntecedencia(minutos: number): string {
  if (minutos % MINUTOS_24_HORAS === 0) return plural(minutos / MINUTOS_24_HORAS, 'dia', 'dias');
  if (minutos % 60 === 0) return plural(minutos / 60, 'hora', 'horas');
  return plural(minutos, 'minuto', 'minutos');
}

export function tituloLembrete(minutosAntes: number): string {
  // 24h é tratado como "24 horas" (e não "1 dia"), que é como o tutor entende o aviso.
  const descricao =
    minutosAntes === MINUTOS_24_HORAS ? '24 horas' : descreverAntecedencia(minutosAntes);
  return `Evento em ${descricao}`;
}

export function corpoLembrete(
  evento: Pick<Evento, 'nomeTipoEvento' | 'hora'>,
  nomePet?: string | null,
): string {
  const hora = evento.hora ? PADRAO_HORA.exec(evento.hora) : null;
  const quando = hora ? ` às ${hora[1]}:${hora[2]}` : '';
  return `${evento.nomeTipoEvento}${nomePet ? ` — ${nomePet}` : ''}${quando}`;
}

/**
 * Identificador estável do lembrete de um evento. Guarda a antecedência no próprio id, o que permite
 * recriar os mesmos avisos depois de um reagendamento e evita duplicar o mesmo aviso.
 */
export function idLembrete(eventoId: string, minutosAntes: number): string {
  return `evento-${eventoId}-lembrete-${minutosAntes}`;
}

/** Extrai a antecedência (em minutos) de um id criado por `idLembrete`; `null` para ids antigos. */
export function minutosDoIdLembrete(id: string): number | null {
  const encontrado = /^evento-.+-lembrete-(\d+)$/.exec(id);
  return encontrado ? Number(encontrado[1]) : null;
}
