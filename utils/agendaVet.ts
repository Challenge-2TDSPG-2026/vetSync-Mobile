import { parseDataEvento } from './eventoStatus';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function dataPorExtenso(d: Date) {
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export function horaCurta(iso: string) {
  return parseDataEvento(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Texto de quando o atendimento acontece: "em 25 min", "hoje às 14:00", "amanhã às 09:00" ou "23 de outubro às 09:00". */
export function quandoAcontece(iso: string) {
  const data = parseDataEvento(iso);
  const agora = new Date();
  const hora = horaCurta(iso);
  const minutos = Math.round((data.getTime() - agora.getTime()) / 60000);
  if (mesmoDia(data, agora)) {
    if (iso.length > 10 && minutos > 0 && minutos < 60) return `em ${minutos} min`;
    return iso.length > 10 ? `hoje às ${hora}` : 'hoje';
  }
  const amanha = new Date(agora);
  amanha.setDate(agora.getDate() + 1);
  const complemento = iso.length > 10 ? ` às ${hora}` : '';
  if (mesmoDia(data, amanha)) return `amanhã${complemento}`;
  return `${data.getDate()} de ${MESES[data.getMonth()]}${complemento}`;
}
