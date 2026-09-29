import { DOMAIN_COLORS } from './theme';
import type { StatusEventoExibicao } from '../types';

export const ESPECIES = [
  { valor: 'cachorro', label: 'Cão', icon: 'dog', iconSet: 'MaterialCommunityIcons' },
  { valor: 'gato', label: 'Gato', icon: 'cat', iconSet: 'MaterialCommunityIcons' },
  { valor: 'pássaro', label: 'Ave', icon: 'bird', iconSet: 'MaterialCommunityIcons' },
  { valor: 'outro', label: 'Outro', icon: 'paw', iconSet: 'MaterialCommunityIcons' },
] as const;

export const TIPOS_EVENTO = [
  { valor: 'vacina', label: 'Vacina', icon: 'needle', iconSet: 'MaterialCommunityIcons', cor: DOMAIN_COLORS.event.vaccine },
  { valor: 'vermifugo', label: 'Vermífugo', icon: 'bug-outline', iconSet: 'Ionicons', cor: DOMAIN_COLORS.event.deworming },
  { valor: 'consulta', label: 'Consulta', icon: 'medical-bag', iconSet: 'MaterialCommunityIcons', cor: DOMAIN_COLORS.event.consultation },
  { valor: 'medicamento', label: 'Medicamento', icon: 'medkit-outline', iconSet: 'Ionicons', cor: DOMAIN_COLORS.event.medication },
  { valor: 'checkup', label: 'Check-up', icon: 'pulse-outline', iconSet: 'Ionicons', cor: DOMAIN_COLORS.event.checkup },
  { valor: 'outro', label: 'Outro', icon: 'document-text-outline', iconSet: 'Ionicons', cor: DOMAIN_COLORS.event.other },
] as const;

export const SUGESTOES_TITULO: Record<string, Record<string, string[]>> = {
  vacina: {
    cachorro: ['V8 / V10', 'Antirrábica', 'Gripe Canina', 'Leishmaniose'],
    gato: ['Tríplice Felina (V3)', 'Antirrábica', 'FeLV (Leucemia Felina)', 'Quádrupla Felina'],
    pássaro: ['Doença de Newcastle', 'Reforço anual'],
    outro: ['Vacina de reforço', 'Imunização anual'],
  },
  vermifugo: {
    cachorro: ['Drontal Plus', 'Milbemax', 'Vermifugação trimestral'],
    gato: ['Drontal Gatos', 'Milbemax Gatos', 'Vermifugação semestral'],
    pássaro: ['Vermifugação anual'],
    outro: ['Vermifugação periódica'],
  },
  consulta: {
    cachorro: ['Consulta de rotina', 'Retorno veterinário', 'Dermatologia', 'Cardiologia'],
    gato: ['Consulta de rotina', 'Retorno veterinário', 'Odontologia felina'],
    pássaro: ['Consulta de rotina', 'Exame de plumagem'],
    outro: ['Consulta de rotina', 'Retorno veterinário'],
  },
  medicamento: {
    cachorro: ['Antipulgas mensal', 'Carrapicida', 'Suplemento vitamínico', 'Anti-inflamatório'],
    gato: ['Antipulgas mensal', 'Suplemento renal', 'Probiótico'],
    pássaro: ['Suplemento vitamínico', 'Antibiótico prescrito'],
    outro: ['Medicamento prescrito'],
  },
  checkup: {
    cachorro: ['Check-up anual completo', 'Hemograma', 'Ultrassom abdominal'],
    gato: ['Check-up anual completo', 'Perfil renal', 'Hemograma completo'],
    pássaro: ['Check-up anual', 'Exame de fezes'],
    outro: ['Check-up de rotina'],
  },
  outro: {
    cachorro: ['Banho e tosa', 'Higiene dental', 'Corte de unhas'],
    gato: ['Banho', 'Higiene dental', 'Corte de unhas'],
    pássaro: ['Banho', 'Corte de bico'],
    outro: ['Cuidado geral'],
  },
};

export const STATUS_EVENTO: Record<StatusEventoExibicao, { label: string; bg: string; color: string }> = {
  AGENDADO: { label: 'Agendado', bg: DOMAIN_COLORS.eventStatus.scheduled.background, color: DOMAIN_COLORS.eventStatus.scheduled.text },
  CONCLUIDO: { label: 'Realizado', bg: DOMAIN_COLORS.eventStatus.completed.background, color: DOMAIN_COLORS.eventStatus.completed.text },
  CANCELADO: { label: 'Cancelada', bg: DOMAIN_COLORS.eventStatus.cancelled.background, color: DOMAIN_COLORS.eventStatus.cancelled.text },
  ATRASADO: { label: 'Atrasado', bg: DOMAIN_COLORS.eventStatus.overdue.background, color: DOMAIN_COLORS.eventStatus.overdue.text },
};