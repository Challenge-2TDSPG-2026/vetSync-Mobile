export const META_CONSULTAS_RECOMPENSA = 5;
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
    id: 'sem-atrasos',
    titulo: 'Rotina em Dia',
    descricao: 'Nenhum evento atrasado no momento',
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
    descricao: 'Resgatou o primeiro cupom deste pet',
    icon: 'gift',
    iconSet: 'Ionicons',
  },
] as const;