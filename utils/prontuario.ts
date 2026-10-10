import type {
  AtendimentoProntuario,
  ExameProntuario,
  FiltrosProntuario,
  OrientacaoProntuario,
  Prontuario,
  ReceitaProntuario,
  SecaoProntuario,
  TipoEntradaProntuario,
} from '../services/prontuarioService';

export const TODAS_AS_SECOES: SecaoProntuario[] = ['PERFIL_SAUDE', 'ATENDIMENTOS', 'ORIENTACOES', 'RECEITAS', 'EXAMES'];

export const ROTULO_SECAO: Record<SecaoProntuario, string> = {
  PERFIL_SAUDE: 'Perfil de saúde',
  ATENDIMENTOS: 'Atendimentos',
  ORIENTACOES: 'Orientações',
  RECEITAS: 'Receitas',
  EXAMES: 'Exames',
};

export const DESCRICAO_SECAO: Record<SecaoProntuario, string> = {
  PERFIL_SAUDE: 'Peso, alergias, medicamentos contínuos e condições',
  ATENDIMENTOS: 'Consultas concluídas, diagnóstico e conduta',
  ORIENTACOES: 'Cuidados passados pelo veterinário',
  RECEITAS: 'Receitas liberadas pela clínica',
  EXAMES: 'Resultados e laudos',
};

export type FiltroLinhaDoTempo = 'TUDO' | TipoEntradaProntuario;

export const FILTROS_LINHA_DO_TEMPO: { chave: FiltroLinhaDoTempo; rotulo: string }[] = [
  { chave: 'TUDO', rotulo: 'Tudo' },
  { chave: 'ATENDIMENTO', rotulo: 'Atendimentos' },
  { chave: 'ORIENTACAO', rotulo: 'Orientações' },
  { chave: 'RECEITA', rotulo: 'Receitas' },
  { chave: 'EXAME', rotulo: 'Exames' },
];

export const VALIDADES_DIAS = [1, 3, 7, 15, 30] as const;
export const VALIDADE_PADRAO_DIAS = 7;

export type PeriodoCompartilhamento = 'TUDO' | '6M' | '12M';

export const PERIODOS_COMPARTILHAMENTO: { chave: PeriodoCompartilhamento; rotulo: string }[] = [
  { chave: 'TUDO', rotulo: 'Todo o histórico' },
  { chave: '6M', rotulo: 'Últimos 6 meses' },
  { chave: '12M', rotulo: 'Último ano' },
];

/** Só formatos que o backend aceita para laudos. */
export const TIPOS_LAUDO_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;
export const TAMANHO_MAXIMO_LAUDO_BYTES = 10 * 1024 * 1024;

const NAO_INFORMADO = 'Não informado';

// ------------------------------------------------------------------ datas

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

export function dataParaIso(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** AAAA-MM-DD (ou datetime ISO) -> DD/MM/AAAA. Devolve o texto padrão quando não há data válida. */
export function formatarDataProntuario(valor?: string | null, vazio: string = NAO_INFORMADO): string {
  const iso = valor?.slice(0, 10);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return vazio;
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHoraProntuario(valor?: string | null, vazio: string = NAO_INFORMADO): string {
  if (!valor) return vazio;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return vazio;
  return `${formatarDataProntuario(dataParaIso(data))} ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** Máscara DD/MM/AAAA para digitação. */
export function mascaraDataBr(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

/** DD/MM/AAAA -> AAAA-MM-DD, ou null se a data não existir. */
export function dataBrParaIso(dataBr: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataBr.trim());
  if (!partes) return null;
  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const ano = Number(partes[3]);
  const data = new Date(ano, mes - 1, dia);
  const valida = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return valida ? `${partes[3]}-${partes[2]}-${partes[1]}` : null;
}

/** Início do período escolhido para o compartilhamento (undefined = sem limite). */
export function inicioDoPeriodo(periodo: PeriodoCompartilhamento, hoje: Date = new Date()): string | undefined {
  if (periodo === 'TUDO') return undefined;
  const meses = periodo === '6M' ? 6 : 12;
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - meses, hoje.getDate());
  // 31/08 menos 6 meses vira 31/02 -> o JS rola para março; voltamos ao último dia do mês certo.
  if (inicio.getDate() !== hoje.getDate()) inicio.setDate(0);
  return dataParaIso(inicio);
}

// ------------------------------------------------------------------ requisição

export function montarQueryProntuario(filtros: FiltrosProntuario = {}, formato?: 'JSON' | 'HTML'): string {
  const parametros: string[] = [];
  if (formato) parametros.push(`formato=${formato}`);
  if (filtros.secoes?.length) parametros.push(`secoes=${filtros.secoes.join(',')}`);
  if (filtros.de) parametros.push(`de=${filtros.de}`);
  if (filtros.ate) parametros.push(`ate=${filtros.ate}`);
  return parametros.length ? `?${parametros.join('&')}` : '';
}

export function chaveFiltros(filtros: FiltrosProntuario = {}): string {
  return `${[...(filtros.secoes ?? [])].sort().join(',')}|${filtros.de ?? ''}|${filtros.ate ?? ''}`;
}

// ------------------------------------------------------------------ linha do tempo

export type ItemProntuario =
  | { tipo: 'ATENDIMENTO'; id: string; data: string | null; atendimento: AtendimentoProntuario }
  | { tipo: 'ORIENTACAO'; id: string; data: string | null; orientacao: OrientacaoProntuario }
  | { tipo: 'RECEITA'; id: string; data: string | null; receita: ReceitaProntuario }
  | { tipo: 'EXAME'; id: string; data: string | null; exame: ExameProntuario };

/** Junta a linha do tempo com os detalhes de cada entrada, já filtrada. Entradas sem detalhe são descartadas. */
export function montarItensProntuario(prontuario: Prontuario, filtro: FiltroLinhaDoTempo = 'TUDO'): ItemProntuario[] {
  const atendimentos = new Map(prontuario.atendimentos.map(item => [item.id, item]));
  const orientacoes = new Map(prontuario.orientacoes.map(item => [item.id, item]));
  const receitas = new Map(prontuario.receitas.map(item => [item.id, item]));
  const exames = new Map(prontuario.exames.map(item => [item.id, item]));

  const itens: ItemProntuario[] = [];
  for (const entrada of prontuario.linhaDoTempo) {
    if (filtro !== 'TUDO' && entrada.tipo !== filtro) continue;
    const { id, data } = entrada;
    if (entrada.tipo === 'ATENDIMENTO') {
      const atendimento = atendimentos.get(id);
      if (atendimento) itens.push({ tipo: 'ATENDIMENTO', id, data, atendimento });
    } else if (entrada.tipo === 'ORIENTACAO') {
      const orientacao = orientacoes.get(id);
      if (orientacao) itens.push({ tipo: 'ORIENTACAO', id, data, orientacao });
    } else if (entrada.tipo === 'RECEITA') {
      const receita = receitas.get(id);
      if (receita) itens.push({ tipo: 'RECEITA', id, data, receita });
    } else {
      const exame = exames.get(id);
      if (exame) itens.push({ tipo: 'EXAME', id, data, exame });
    }
  }
  return itens;
}

export function contarPorTipo(prontuario: Prontuario): Record<FiltroLinhaDoTempo, number> {
  return {
    TUDO: prontuario.atendimentos.length + prontuario.orientacoes.length + prontuario.receitas.length + prontuario.exames.length,
    ATENDIMENTO: prontuario.atendimentos.length,
    ORIENTACAO: prontuario.orientacoes.length,
    RECEITA: prontuario.receitas.length,
    EXAME: prontuario.exames.length,
  };
}

// ------------------------------------------------------------------ compartilhamento

export function alternarSecao(atuais: SecaoProntuario[], secao: SecaoProntuario): SecaoProntuario[] {
  return atuais.includes(secao) ? atuais.filter(item => item !== secao) : [...atuais, secao];
}

export type SituacaoCompartilhamento = 'ATIVO' | 'REVOGADO' | 'EXPIRADO';

export function situacaoCompartilhamento(item: {
  ativo: boolean;
  revogadaEm: string | null;
}): SituacaoCompartilhamento {
  if (item.revogadaEm) return 'REVOGADO';
  return item.ativo ? 'ATIVO' : 'EXPIRADO';
}

export function resumoSecoes(secoes: SecaoProntuario[]): string {
  if (secoes.length === TODAS_AS_SECOES.length) return 'Prontuário completo';
  return secoes.map(secao => ROTULO_SECAO[secao]).join(', ');
}

// ------------------------------------------------------------------ laudos

export function validarArquivoLaudo(arquivo: { tipoMime?: string | null; tamanho?: number | null }): string | null {
  const tipo = arquivo.tipoMime?.toLowerCase() ?? '';
  if (!(TIPOS_LAUDO_PERMITIDOS as readonly string[]).includes(tipo)) {
    return 'Use um arquivo PDF, JPEG, PNG ou WebP.';
  }
  if (arquivo.tamanho != null && arquivo.tamanho > TAMANHO_MAXIMO_LAUDO_BYTES) {
    return 'O arquivo excede o limite de 10 MB.';
  }
  return null;
}

/** Remove caminhos, aspas e caracteres de controle para usar o nome ao salvar o arquivo no aparelho. */
export function nomeSeguroArquivo(nome?: string | null, padrao = 'arquivo'): string {
  const limpo = (nome ?? '')
    .replace(/\\/g, '/')
    .split('/')
    .pop()!
    .replace(/[\u0000-\u001f"<>:|?*]/g, '')
    .trim();
  return limpo || padrao;
}

export function slugDoPet(nome: string): string {
  const slug = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'pet';
}
