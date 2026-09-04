import type { StatusEventoExibicao } from '../types';

export const ESPECIES = [
  { valor: 'cachorro', label: 'Cão', icon: 'dog', iconSet: 'MaterialCommunityIcons' },
  { valor: 'gato', label: 'Gato', icon: 'cat', iconSet: 'MaterialCommunityIcons' },
  { valor: 'pássaro', label: 'Ave', icon: 'bird', iconSet: 'MaterialCommunityIcons' },
  { valor: 'outro', label: 'Outro', icon: 'paw', iconSet: 'MaterialCommunityIcons' },
] as const;

export const TIPOS_EVENTO = [
  { valor: 'vacina', label: 'Vacina', icon: 'needle', iconSet: 'MaterialCommunityIcons', cor: '#22a06b' },
  { valor: 'vermifugo', label: 'Vermífugo', icon: 'bug-outline', iconSet: 'Ionicons', cor: '#9B59B6' },
  { valor: 'consulta', label: 'Consulta', icon: 'medical-bag', iconSet: 'MaterialCommunityIcons', cor: '#2563eb' },
  { valor: 'medicamento', label: 'Medicamento', icon: 'medkit-outline', iconSet: 'Ionicons', cor: '#e67e22' },
  { valor: 'checkup', label: 'Check-up', icon: 'pulse-outline', iconSet: 'Ionicons', cor: '#1ABC9C' },
  { valor: 'outro', label: 'Outro', icon: 'document-text-outline', iconSet: 'Ionicons', cor: '#7a6a5e' },
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
  AGENDADO: { label: 'Agendado', bg: '#dbeafe', color: '#1e40af' },
  CONCLUIDO: { label: 'Realizado', bg: '#dcfce7', color: '#166534' },
  CANCELADO: { label: 'Cancelada', bg: '#f3f4f6', color: '#4b5563' },
  ATRASADO: { label: 'Atrasado', bg: '#fee2e2', color: '#991b1b' },
};