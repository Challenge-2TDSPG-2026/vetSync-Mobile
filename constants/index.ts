export const CORES = {
  primaria: '#0e3326',
  secundaria: '#22a06b',
  destaque: '#3db87e',
  alerta: '#dc3545',
  aviso: '#e67e22',
  info: '#2563eb',
  fundo: '#fafaf8',
  fundoCard: '#FFFFFF',
  fundoSutil: '#f0ece5',
  texto: '#1a1512',
  textoSecundario: '#7a6a5e',
  borda: '#e8e2da',
  success: '#166534',
  successBg: '#dcfce7',
  alertaBg: '#fee2e2',
  avisoBg: '#fef3c7',
  infoBg: '#dbeafe',
};

export const STORAGE_KEYS = {

  PET_ATIVO: '@vetsync:pet_ativo',
  ONBOARDING_CONCLUIDO: '@vetsync:onboarding',
  NOTIFICACOES: '@vetsync:notificacoes',
  LEMBRETES_EVENTO: '@vetsync:lembretes_evento',
  SESSAO: '@vetsync:sessao',
  MODO_SIMPLES: '@vetsync:modo_simples',
};

export const XP_POR_EVENTO = 10;

export const NIVEIS = [
  { nivel: 1, titulo: 'Iniciante', xpMin: 0 },
  { nivel: 2, titulo: 'Aprendiz', xpMin: 50 },
  { nivel: 3, titulo: 'Cuidador Dedicado', xpMin: 100 },
  { nivel: 4, titulo: 'Cuidador Dedicado', xpMin: 150 },
  { nivel: 5, titulo: 'Guardião Experiente', xpMin: 200 },
  { nivel: 6, titulo: 'Guardião Experiente', xpMin: 250 },
  { nivel: 7, titulo: 'Guardião Experiente', xpMin: 300 },
  { nivel: 8, titulo: 'Mestre Pet', xpMin: 350 },
  { nivel: 9, titulo: 'Mestre Pet', xpMin: 400 },
  { nivel: 10, titulo: 'Lenda do Cuidado', xpMin: 450 },
] as const;

export const CONQUISTAS = [
  {
    id: 'primeiro-cadastro',
    titulo: 'Primeiros Passos',
    descricao: 'Cadastrou este pet no VetSync',
    icon: 'paw',
    iconSet: 'MaterialCommunityIcons',
  },
  {
    id: 'primeira-consulta',
    titulo: 'Primeira Consulta',
    descricao: 'Concluiu a primeira consulta veterinária',
    icon: 'medical-bag',
    iconSet: 'MaterialCommunityIcons',
  },
  {
    id: 'cinco-eventos',
    titulo: 'Bom Cuidador',
    descricao: 'Concluiu 5 eventos de saúde',
    icon: 'heart-outline',
    iconSet: 'Ionicons',
  },
  {
    id: 'vinte-eventos',
    titulo: 'Super Cuidador',
    descricao: 'Concluiu 20 eventos de saúde',
    icon: 'heart',
    iconSet: 'Ionicons',
  },
  {
    id: 'vacinacao-em-dia',
    titulo: 'Vacinação em Dia',
    descricao: 'Nenhuma vacina deste pet está atrasada',
    icon: 'shield-checkmark-outline',
    iconSet: 'Ionicons',
  },
  {
    id: 'sem-cancelamentos',
    titulo: 'Rotina em Dia',
    descricao: 'Nenhum evento cancelado no momento',
    icon: 'checkmark-done-outline',
    iconSet: 'Ionicons',
  },
  {
    id: 'dez-registros',
    titulo: 'Historiador',
    descricao: 'Registrou 10 eventos de saúde no total',
    icon: 'book-outline',
    iconSet: 'Ionicons',
  },
  {
    id: 'primeiro-resgate',
    titulo: 'Fidelidade Recompensada',
    descricao: 'Resgatou o primeiro item de recompensa',
    icon: 'gift',
    iconSet: 'Ionicons',
  },
] as const;

export const ESPECIES = [
  { valor: 'cachorro', label: 'Cão', icon: 'dog', iconSet: 'MaterialCommunityIcons', grupo: 'Companhia' },
  { valor: 'gato', label: 'Gato', icon: 'cat', iconSet: 'MaterialCommunityIcons', grupo: 'Companhia' },
  { valor: 'coelho', label: 'Coelho', icon: 'rabbit', iconSet: 'MaterialCommunityIcons', grupo: 'Companhia' },
  { valor: 'equino', label: 'Equino', icon: 'horse', iconSet: 'MaterialCommunityIcons', grupo: 'Produção' },
  { valor: 'bovino', label: 'Bovino', icon: 'cow', iconSet: 'MaterialCommunityIcons', grupo: 'Produção' },
  { valor: 'suino', label: 'Suíno', icon: 'pig', iconSet: 'MaterialCommunityIcons', grupo: 'Produção' },
  { valor: 'ovino', label: 'Ovino', icon: 'sheep', iconSet: 'MaterialCommunityIcons', grupo: 'Produção' },
  { valor: 'caprino', label: 'Caprino', icon: 'goat', iconSet: 'MaterialCommunityIcons', grupo: 'Produção' },
  { valor: 'ave', label: 'Ave', icon: 'bird', iconSet: 'MaterialCommunityIcons', grupo: 'Outros' },
  { valor: 'reptil', label: 'Réptil', icon: 'turtle', iconSet: 'MaterialCommunityIcons', grupo: 'Outros' },
  { valor: 'anfibio', label: 'Anfíbio', icon: 'frog', iconSet: 'MaterialCommunityIcons', grupo: 'Outros' },
  { valor: 'peixe', label: 'Peixe', icon: 'fish', iconSet: 'MaterialCommunityIcons', grupo: 'Outros' },
  { valor: 'roedor', label: 'Roedor', icon: 'rodent', iconSet: 'MaterialCommunityIcons', grupo: 'Outros' },
  { valor: 'furao', label: 'Furão', icon: 'ferret', iconSet: 'MaterialCommunityIcons', grupo: 'Outros' },
] as const;

export const GRUPOS_ESPECIE = ['Companhia', 'Produção', 'Outros'] as const;

interface VisualTipoEvento {
  icon: string;
  iconSet: 'Ionicons' | 'MaterialCommunityIcons';
  cor: string;
}

const REGRAS_VISUAL_TIPO_EVENTO: { palavras: string[]; visual: VisualTipoEvento }[] = [
  { palavras: ['vacin'], visual: { icon: 'needle', iconSet: 'MaterialCommunityIcons', cor: '#22a06b' } },
  { palavras: ['vermif'], visual: { icon: 'bug-outline', iconSet: 'Ionicons', cor: '#9B59B6' } },
  { palavras: ['consult'], visual: { icon: 'medical-bag', iconSet: 'MaterialCommunityIcons', cor: '#2563eb' } },
  { palavras: ['medicamento', 'adesão', 'adesao'], visual: { icon: 'medkit-outline', iconSet: 'Ionicons', cor: '#e67e22' } },
  { palavras: ['check-up', 'checkup'], visual: { icon: 'pulse-outline', iconSet: 'Ionicons', cor: '#1ABC9C' } },
  { palavras: ['cirurg'], visual: { icon: 'cut-outline', iconSet: 'Ionicons', cor: '#dc3545' } },
  { palavras: ['banho', 'tosa'], visual: { icon: 'water-outline', iconSet: 'Ionicons', cor: '#2563eb' } },
  { palavras: ['emergênc', 'emergenc', 'triagem'], visual: { icon: 'alert-circle-outline', iconSet: 'Ionicons', cor: '#dc3545' } },
];

const VISUAL_PADRAO: VisualTipoEvento = { icon: 'document-text-outline', iconSet: 'Ionicons', cor: '#7a6a5e' };

export function obterVisualTipoEvento(nomeTipo: string): VisualTipoEvento {
  const nomeNormalizado = nomeTipo.toLowerCase();
  const regra = REGRAS_VISUAL_TIPO_EVENTO.find(r => r.palavras.some(p => nomeNormalizado.includes(p)));
  return regra?.visual ?? VISUAL_PADRAO;
}

export { TIPOS_EVENTO, SUGESTOES_TITULO, STATUS_EVENTO } from './events';