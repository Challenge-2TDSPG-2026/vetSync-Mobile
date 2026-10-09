export interface Pet {
  id: string;
  nome: string;
  especie: 'cachorro' | 'gato' | 'equino' | 'bovino' | 'suino' | 'ovino' | 'caprino' | 'ave' | 'reptil' | 'anfibio' | 'peixe' | 'roedor' | 'coelho' | 'furao';
  sexo: 'macho' | 'femea';
  raca: string;
  dataNascimento: string;
  peso: string;
  numero?: string | null;
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
export type StatusConfirmacao = 'PENDENTE' | 'CONFIRMADO' | 'RECUSADO';
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
  especialidade: string | null;
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
  hora?: string;
  observacao?: string;
  motivoCancelamento?: string;
  custo: number;
  /** Etapa de confirmação da clínica (ausente em backends antigos = confirmado). */
  statusConfirmacao?: StatusConfirmacao;
  idServicoClinica?: number;
  idProfissionalEstetica?: number;
  criadoEm?: string;
}

export interface Recompensa {
  id: string;
  nome: string;
  descricao?: string;
  custoPontos: number;
  tipo: 'PRODUTO' | 'CUPOM_DESCONTO';
  ativa: boolean;
  imagemUrl?: string;
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

export interface PerfilSaudePet {
  petId?: string;
  pesoAtual: number | null;
  pesoAtualizadoEm: string | null;
  alergias: string | null;
  medicamentosContinuos: string | null;
  restricoesAlimentares: string | null;
  condicoesPreExistentes: string | null;
  observacoesImportantes: string | null;
  contatoEmergencia: string | null;
  veterinarioPreferencialId: number | null;
}

export type PerfilSaudePetAtualizacao = Omit<PerfilSaudePet, 'petId' | 'pesoAtualizadoEm'>;

export interface RelatorioClinica {
  consultasAgendadas: number;
  consultasConcluidas: number;
  cancelamentos: number;
  faltas?: number;
  faturamento: number;
  pacientesAtendidos: number;
  retornosPendentes?: number;
  vacinasAplicadas: number;
  tempoMedioConclusaoHoras?: number;
}

export interface RegistroAuditoria {
  id: string;
  usuarioResponsavel: string;
  perfil: string;
  acao: string;
  dataHora: string;
  valorAnterior?: string | null;
  valorNovo?: string | null;
}