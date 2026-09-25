export interface Pet {
  id: string;
  nome: string;
  especie: 'cachorro' | 'gato' | 'equino' | 'bovino' | 'suino' | 'ovino' | 'caprino' | 'ave' | 'reptil' | 'anfibio' | 'peixe' | 'roedor' | 'coelho' | 'furao';
  sexo: 'macho' | 'femea';
  raca: string;
  dataNascimento: string;
  peso: string;
  tutor?: Tutor;
  fotoUrl?: string | null;
}

export interface Tutor {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
}

export type StatusEvento = 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO';
export type StatusEventoExibicao = StatusEvento | 'ATRASADO';
export interface TipoEvento {
  id: string;
  nome: string;
  categoria: 'PREVENTIVO' | 'TERAPEUTICO' | 'BEM_ESTAR' | 'EMERGENCIA' | null;
  pontos: number;
}
export interface Veterinario {
  id: string;
  nome: string;
  crmv: string;
  idClinica: string | null;
  nomeClinica: string | null;
}

export interface Evento {
  id: string;
  petId: string;
  status: StatusEvento;
  idTipoEvento: string;
  nomeTipoEvento: string;
  categoriaTipoEvento: TipoEvento['categoria'];
  idVeterinario: string;
  nomeVeterinario: string;
  data: string; 
  observacao?: string;
  motivoCancelamento?: string;
  custo: number;
}

export interface Recompensa {
  id: string;
  nome: string;
  descricao?: string;
  custoPontos: number;
  tipo: 'PRODUTO' | 'CUPOM_DESCONTO';
  ativa: boolean;
}

export interface Resgate {
  id: string;
  status: 'PENDENTE' | 'VALIDADO' | 'NEGADO';
  dataResgate: string;
  nomeRecompensa: string;
  custoPontos: number;
  nomeVeterinarioValidador?: string;
}

export interface FaixaDisponibilidade {
  id: string;
  diaSemana: number; 
  horaInicio: string; 
  horaFim: string;
}
export interface BloqueioAgenda {
  id: string;
  dataInicio: string; 
  dataFim: string;
  motivo?: string;
}
