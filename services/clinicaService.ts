import { api } from './api/httpClient';

export interface PerfilClinica {
  idClinica: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  possuiLogo: boolean;
  horarios: { diaSemana: number; inicio: string; fim: string }[];
}

export interface ServicoClinica {
  id: number;
  nome: string;
  categoria: string;
  duracaoMinutos: number;
}
export interface SlotClinica {
  idServico: number;
  tipoProfissional: 'VETERINARIO' | 'ESTETICA';
  idProfissional: number;
  nomeProfissional: string;
  hora: string;
}
export interface ConversaClinica {
  idConversa: number;
  idClinica: number;
  nomeClinica: string;
  idTutor: number;
  nomeTutor: string;
  criadaEm: string;
}
export interface MensagemClinica {
  idMensagem: number;
  idConversa: number;
  remetente: 'TUTOR' | 'CLINICA';
  texto: string;
  enviadaEm: string;
}

export const clinicaService = {
  perfil: () => api.get<PerfilClinica>('/minha-clinica/perfil'),
  listarServicos: () => api.get<ServicoClinica[]>('/agenda/servicos'),
  listarSlots: (idServico: number, data: string) =>
    api.get<SlotClinica[]>(`/agenda/servicos/${idServico}/slots?data=${encodeURIComponent(data)}`),
  agendar: (idServico: number, idPet: number, slot: SlotClinica, data: string, observacao: string) =>
    api.post<{ idEvento: number }>(`/agenda/servicos/${idServico}/agendar`, {
      idPet,
      idVeterinario: slot.tipoProfissional === 'VETERINARIO' ? slot.idProfissional : null,
      idProfissionalEstetica: slot.tipoProfissional === 'ESTETICA' ? slot.idProfissional : null,
      data,
      hora: slot.hora,
      observacao,
    }),
  conversas: () => api.get<ConversaClinica[]>('/mensagens-clinica/conversas'),
  iniciarConversa: () => api.post<ConversaClinica>('/mensagens-clinica/conversas', {}),
  mensagens: (idConversa: number) => api.get<MensagemClinica[]>(`/mensagens-clinica/conversas/${idConversa}/mensagens`),
  enviarMensagem: (idConversa: number, texto: string) =>
    api.post<MensagemClinica>(`/mensagens-clinica/conversas/${idConversa}/mensagens`, { texto }),
};
