import type { CarteiraVacinacao, ProximaAcao, Vacina } from '../services/petHealthService';
import { parseDataEvento } from './eventoStatus';

/**
 * Plano preventivo do pet.
 *
 * IMPORTANTE: este módulo NÃO define regras clínicas (intervalos de vacina,
 * calendário por espécie etc.). Datas de vencimento, status das vacinas e
 * recomendações vêm do backend, a partir dos registros e das regras da
 * clínica/veterinário. Aqui só normalizamos, ordenamos e rotulamos o que chega.
 */

export type PlanoStatus = 'ATRASADO' | 'VENCENDO' | 'FUTURO' | 'EM_DIA';
export type PlanoOrigem = 'VACINA' | 'CUIDADO';

export interface PlanoItem {
  id: string;
  origem: PlanoOrigem;
  titulo: string;
  descricao: string | null;
  status: PlanoStatus;
  /** Data de vencimento (ISO) definida pelo registro/regra da clínica. */
  dataVencimento: string | null;
  /** Negativo = atrasado; 0 = hoje. Null quando não há data. */
  diasParaVencer: number | null;
  eventoId: string | null;
  podeAgendar: boolean;
  /** Nome usado para pré-selecionar o serviço no agendamento (casado com o catálogo da clínica). */
  servicoSugerido: string;
}

export interface ResumoPlano {
  atrasados: number;
  vencendo: number;
  futuros: number;
  emDia: number;
  /** Itens que exigem atenção (atrasados + vencendo). */
  atencao: number;
}

/**
 * Janela usada APENAS como fallback para itens sem status vindo do backend
 * (ex.: "próximas ações", que trazem só `dataLimite` e `prioridade`).
 * Espelha a janela de 30 dias que o próprio backend usa em `VacinaService.status`.
 * Vacinas já chegam classificadas (EM_DIA/VENCENDO/ATRASADA/FUTURA) pelo backend.
 */
export const JANELA_FALLBACK_VENCENDO_DIAS = 30;

const PESO_STATUS: Record<PlanoStatus, number> = { ATRASADO: 0, VENCENDO: 1, FUTURO: 2, EM_DIA: 3 };

function inicioDoDia(data: Date): Date {
  const copia = new Date(data);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

export function diasAte(iso: string | null | undefined, hoje: Date = new Date()): number | null {
  if (!iso) return null;
  const alvo = parseDataEvento(iso);
  if (Number.isNaN(alvo.getTime())) return null;
  const ms = inicioDoDia(alvo).getTime() - inicioDoDia(hoje).getTime();
  return Math.round(ms / 86_400_000);
}

function statusPorData(dias: number | null, altaPrioridade: boolean): PlanoStatus {
  if (dias === null) return altaPrioridade ? 'VENCENDO' : 'FUTURO';
  if (dias < 0) return 'ATRASADO';
  if (altaPrioridade || dias <= JANELA_FALLBACK_VENCENDO_DIAS) return 'VENCENDO';
  return 'FUTURO';
}

function statusDaVacina(vacina: Vacina, dias: number | null): PlanoStatus {
  switch (vacina.status) {
    case 'ATRASADA': return 'ATRASADO';
    case 'VENCENDO': return 'VENCENDO';
    case 'FUTURA': return 'FUTURO';
    case 'EM_DIA': return 'EM_DIA';
    default: return statusPorData(dias, false);
  }
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function vacinaParaItem(vacina: Vacina, hoje: Date = new Date()): PlanoItem {
  const dias = diasAte(vacina.proximaDoseEm, hoje);
  const status = statusDaVacina(vacina, dias);
  return {
    id: `vacina:${vacina.id}`,
    origem: 'VACINA',
    titulo: vacina.nome,
    descricao: vacina.veterinario ? `Registrada por ${vacina.veterinario}` : null,
    status,
    dataVencimento: vacina.proximaDoseEm ?? null,
    diasParaVencer: dias,
    eventoId: vacina.eventoId ?? null,
    podeAgendar: status === 'ATRASADO' || status === 'VENCENDO',
    servicoSugerido: 'Vacina',
  };
}

export function acaoParaItem(acao: ProximaAcao, hoje: Date = new Date()): PlanoItem {
  const dias = diasAte(acao.dataLimite, hoje);
  return {
    id: `acao:${acao.id}`,
    origem: 'CUIDADO',
    titulo: acao.titulo,
    descricao: acao.descricao || null,
    status: statusPorData(dias, acao.prioridade === 'ALTA'),
    dataVencimento: acao.dataLimite ?? null,
    diasParaVencer: dias,
    eventoId: acao.eventoReferenciaId ?? null,
    podeAgendar: acao.podeAgendar,
    servicoSugerido: acao.tipo?.startsWith('VACINA') ? 'Vacina' : acao.titulo.replace(/\s+(atrasad[oa]|vencendo)\s*$/i, '').trim(),
  };
}

export function compararItens(a: PlanoItem, b: PlanoItem): number {
  const porStatus = PESO_STATUS[a.status] - PESO_STATUS[b.status];
  if (porStatus !== 0) return porStatus;
  if (a.diasParaVencer === null && b.diasParaVencer === null) return a.titulo.localeCompare(b.titulo, 'pt-BR');
  if (a.diasParaVencer === null) return 1;
  if (b.diasParaVencer === null) return -1;
  return a.diasParaVencer - b.diasParaVencer;
}

/** Tipos de `proximas-acoes` que NÃO são cuidados agendáveis do plano. */
const TIPOS_FORA_DO_PLANO = new Set(['PESO_DESATUALIZADO']);
/** Tipos que o backend deriva da carteira de vacinação (redundantes quando a carteira carregou). */
const TIPOS_DERIVADOS_DA_CARTEIRA = new Set(['VACINA_ATRASADA', 'VACINA_VENCENDO']);

/**
 * A carteira guarda TODAS as doses. Quando a vacina é reaplicada, a dose antiga
 * continua lá com `proximaDoseEm` no passado e o backend a marca como ATRASADA.
 * Para o plano vale só a dose mais recente de cada vacina; as antigas são histórico.
 * Doses futuras (status FUTURA) ficam à parte: são reaplicações já registradas.
 *
 * Backend atualizado: `substituida` já vem marcada e `tipoVacinaId` identifica o tipo.
 * Backend antigo (sem esses campos): agrupa pelo nome e escolhe a de aplicação mais recente.
 */
export function ultimaDosePorVacina(vacinas: Vacina[]): Vacina[] {
  const maisRecente = new Map<string, Vacina>();
  const futuras: Vacina[] = [];
  for (const v of vacinas) {
    if (v.substituida === true) continue;
    if (v.status === 'FUTURA') { futuras.push(v); continue; }
    const chave = v.tipoVacinaId != null ? `tipo:${v.tipoVacinaId}` : `nome:${normalizar(v.nome)}`;
    const atual = maisRecente.get(chave);
    const dataV = v.aplicadaEm ?? '';
    const dataA = atual?.aplicadaEm ?? '';
    if (!atual || dataV > dataA || (dataV === dataA && (v.proximaDoseEm ?? '') > (atual.proximaDoseEm ?? ''))) {
      maisRecente.set(chave, v);
    }
  }
  return [...maisRecente.values(), ...futuras];
}

/**
 * Une carteira de vacinação + próximas ações num único plano, sem duplicar
 * o que o backend informa nos dois lugares.
 */
export function montarPlano(
  carteira: CarteiraVacinacao | null | undefined,
  acoes: ProximaAcao[] | null | undefined,
  hoje: Date = new Date(),
): PlanoItem[] {
  const carteiraCarregou = !!carteira;
  const vacinas = ultimaDosePorVacina(carteira?.vacinas ?? []).map(v => vacinaParaItem(v, hoje));

  const eventosVacina = new Set(vacinas.map(v => v.eventoId).filter((id): id is string => !!id));
  const titulosVacina = new Set(vacinas.map(v => normalizar(v.titulo)));

  const cuidados = (acoes ?? [])
    .filter(a => !TIPOS_FORA_DO_PLANO.has(a.tipo))
    // Se a carteira carregou, as ações de vacina já estão representadas por ela (e só pela dose mais recente).
    .filter(a => !(carteiraCarregou && TIPOS_DERIVADOS_DA_CARTEIRA.has(a.tipo)))
    .map(a => acaoParaItem(a, hoje))
    .filter(c => {
      if (c.eventoId && eventosVacina.has(c.eventoId)) return false;
      const titulo = normalizar(c.titulo);
      return ![...titulosVacina].some(t => t && (t === titulo || titulo.includes(t)));
    });

  return [...vacinas, ...cuidados].sort(compararItens);
}

export function resumirPlano(itens: PlanoItem[]): ResumoPlano {
  const resumo: ResumoPlano = { atrasados: 0, vencendo: 0, futuros: 0, emDia: 0, atencao: 0 };
  for (const item of itens) {
    if (item.status === 'ATRASADO') resumo.atrasados += 1;
    else if (item.status === 'VENCENDO') resumo.vencendo += 1;
    else if (item.status === 'FUTURO') resumo.futuros += 1;
    else resumo.emDia += 1;
  }
  resumo.atencao = resumo.atrasados + resumo.vencendo;
  return resumo;
}

export function itensDeAtencao(itens: PlanoItem[]): PlanoItem[] {
  return itens.filter(i => i.status === 'ATRASADO' || i.status === 'VENCENDO');
}

export function rotuloPrazo(item: Pick<PlanoItem, 'status' | 'diasParaVencer'>): string {
  const { diasParaVencer: d, status } = item;
  if (d === null) return status === 'EM_DIA' ? 'Em dia' : 'Sem data definida';
  if (d < 0) {
    const n = Math.abs(d);
    return `Atrasado há ${n} dia${n === 1 ? '' : 's'}`;
  }
  if (d === 0) return 'Vence hoje';
  if (d === 1) return 'Vence amanhã';
  return `Vence em ${d} dias`;
}

export const ROTULO_STATUS: Record<PlanoStatus, string> = {
  ATRASADO: 'Atrasado',
  VENCENDO: 'Vencendo',
  FUTURO: 'Programado',
  EM_DIA: 'Em dia',
};

// ───────────────────────── Lembretes locais ─────────────────────────

export interface LembretePlano {
  /** Chave estável: planoItemId + dias antes. */
  chave: string;
  itemId: string;
  quando: Date;
  titulo: string;
  corpo: string;
}

export interface OpcoesLembrete {
  /** Quantos dias antes do vencimento avisar (ex.: [7, 1]). Vem das preferências do tutor. */
  diasAntes: number[];
  /** Hora local do disparo. */
  hora?: number;
  /** Limite de notificações locais (iOS aceita no máximo 64 pendentes no app). */
  limite?: number;
}

export function calcularLembretes(
  itens: PlanoItem[],
  nomePet: string,
  { diasAntes, hora = 9, limite = 30 }: OpcoesLembrete,
  agora: Date = new Date(),
): LembretePlano[] {
  const lembretes: LembretePlano[] = [];

  for (const item of itens) {
    if (!item.podeAgendar || !item.dataVencimento) continue;
    const venc = parseDataEvento(item.dataVencimento);
    if (Number.isNaN(venc.getTime())) continue;

    if (item.status === 'ATRASADO') {
      // Atrasado: um único aviso no próximo dia/horário disponível.
      const quando = inicioDoDia(agora);
      quando.setHours(hora, 0, 0, 0);
      if (quando.getTime() <= agora.getTime()) quando.setDate(quando.getDate() + 1);
      lembretes.push({
        chave: `${item.id}:atrasado`,
        itemId: item.id,
        quando,
        titulo: `${item.titulo} está atrasado`,
        corpo: `${nomePet}: agende para manter o plano preventivo em dia.`,
      });
      continue;
    }

    for (const dias of [...new Set(diasAntes)].filter(d => d >= 0)) {
      const quando = inicioDoDia(venc);
      quando.setDate(quando.getDate() - dias);
      quando.setHours(hora, 0, 0, 0);
      if (quando.getTime() <= agora.getTime()) continue;
      lembretes.push({
        chave: `${item.id}:${dias}`,
        itemId: item.id,
        quando,
        titulo: dias === 0 ? `${item.titulo} vence hoje` : `${item.titulo} vence em ${dias} dia${dias === 1 ? '' : 's'}`,
        corpo: `${nomePet}: toque para ver o plano e agendar.`,
      });
    }
  }

  return lembretes.sort((a, b) => a.quando.getTime() - b.quando.getTime()).slice(0, limite);
}