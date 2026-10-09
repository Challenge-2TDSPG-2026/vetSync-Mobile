import type { StatusListaEspera } from '../services/listaEsperaService';

export const JANELA_MAXIMA_DIAS = 60;

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function dataValida(valor: string): boolean {
  if (!REGEX_DATA.test(valor)) return false;
  const [a, m, d] = valor.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  return data.getFullYear() === a && data.getMonth() === m - 1 && data.getDate() === d;
}

export function horaValida(valor: string): boolean {
  return REGEX_HORA.test(valor);
}

function paraData(valor: string): Date {
  const [a, m, d] = valor.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function adicionarDias(valor: string, dias: number): string {
  const data = paraData(valor);
  data.setDate(data.getDate() + dias);
  return data.toLocaleDateString('sv-SE');
}

export interface DadosJanela {
  dataInicio: string;
  dataFim: string;
  horaMin?: string;
  horaMax?: string;
}

/** Retorna a mensagem de erro para o tutor, ou null se a janela é válida. */
export function validarJanelaEspera(dados: DadosJanela, hoje: Date = new Date()): string | null {
  if (!dataValida(dados.dataInicio) || !dataValida(dados.dataFim)) {
    return 'Use datas no formato AAAA-MM-DD.';
  }
  const inicio = paraData(dados.dataInicio);
  const fim = paraData(dados.dataFim);
  const ref = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  if (inicio < ref) return 'A data inicial não pode ser no passado.';
  if (fim < inicio) return 'A data final precisa ser igual ou depois da inicial.';
  const dias = Math.round((fim.getTime() - inicio.getTime()) / 86_400_000) + 1;
  if (dias > JANELA_MAXIMA_DIAS) return `O período pode ter no máximo ${JANELA_MAXIMA_DIAS} dias.`;

  const min = dados.horaMin?.trim();
  const max = dados.horaMax?.trim();
  if (min && !horaValida(min)) return 'Horário mínimo inválido. Use HH:mm, por exemplo 08:00.';
  if (max && !horaValida(max)) return 'Horário máximo inválido. Use HH:mm, por exemplo 18:00.';
  if (min && max && min > max) return 'O horário mínimo não pode ser maior que o máximo.';
  return null;
}

export const STATUS_ESPERA_VISUAL: Record<StatusListaEspera, { label: string; bg: string; color: string }> = {
  AGUARDANDO: { label: 'Aguardando vaga', bg: '#dbeafe', color: '#1e40af' },
  NOTIFICADO: { label: 'Vaga disponível', bg: '#dcfce7', color: '#166534' },
  ATENDIDO: { label: 'Atendido', bg: '#f0ece5', color: '#7a6a5e' },
  CANCELADO: { label: 'Cancelado', bg: '#f0ece5', color: '#7a6a5e' },
  EXPIRADO: { label: 'Expirado', bg: '#f0ece5', color: '#7a6a5e' },
};

function formatarDiaMes(valor: string): string {
  const [, m, d] = valor.split('-');
  return `${d}/${m}`;
}

export function descreverPeriodo(entrada: { dataInicio: string; dataFim: string; horaMin: string | null; horaMax: string | null }): string {
  const datas = entrada.dataInicio === entrada.dataFim
    ? formatarDiaMes(entrada.dataInicio)
    : `${formatarDiaMes(entrada.dataInicio)} a ${formatarDiaMes(entrada.dataFim)}`;
  if (entrada.horaMin && entrada.horaMax) return `${datas} · entre ${entrada.horaMin} e ${entrada.horaMax}`;
  if (entrada.horaMin) return `${datas} · a partir de ${entrada.horaMin}`;
  if (entrada.horaMax) return `${datas} · até ${entrada.horaMax}`;
  return `${datas} · qualquer horário`;
}