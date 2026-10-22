import { IA_API_BASE_URL } from '../constants/api';
import { api, apiRequest } from './api/httpClient';

export interface RascunhoConsulta {
  petId: number;
  origem: 'IA_RASCUNHO';
  resumo: string;
  pontos: string[];
  perguntas: string[];
}

export interface ResumoConsulta {
  id: number;
  idPet: number;
  idEvento: number | null;
  resumo: string;
  perguntas: string | null;
  origem: string;
  criadoEm: string;
  compartilhadoEm: string | null;
  revogadoEm: string | null;
}

export interface PosConsulta {
  eventoId: number;
  origem: 'REGISTROS_VETERINARIOS';
  mensagem: string;
  orientacoes: { id: number; titulo: string; texto: string; autor: string | null }[];
  medicamentos: { id: number; medicamento: string; posologia: string; inicio: string | null; fim: string | null }[];
  proximosAgendamentos: { id: number; tipo: string | null; data: string; hora: string | null }[];
  planosAtivos: { id: number; veterinario: string | null; itens: { idItem: number; nmTipoEvento: string | null; status: string; dtEvento: string | null }[] }[];
}

export const siaJornadaService = {
  preparar(petId: number, relato: string) {
    return apiRequest<RascunhoConsulta>({ method: 'POST', path: '/api/v1/ia/jornada/preparar',
      body: { petId, relato }, baseUrl: IA_API_BASE_URL, timeoutMs: 60_000 });
  },
  posConsulta(petId: number, eventoId: number) {
    return apiRequest<PosConsulta>({ method: 'POST', path: '/api/v1/ia/jornada/pos-consulta',
      body: { petId, eventoId }, baseUrl: IA_API_BASE_URL, timeoutMs: 30_000 });
  },
  listar(petId: number) { return api.get<ResumoConsulta[]>(`/pets/${petId}/sia/resumos`); },
  listarVet(eventoId: number) { return api.get<ResumoConsulta[]>(`/eventos/${eventoId}/sia/resumos`); },
  salvar(petId: number, resumo: string, perguntas: string, idEvento: number | null) {
    return api.post<ResumoConsulta>(`/pets/${petId}/sia/resumos`, { resumo, perguntas, idEvento });
  },
  atualizar(item: ResumoConsulta, resumo: string, perguntas: string, idEvento: number | null) {
    return api.put<ResumoConsulta>(`/pets/${item.idPet}/sia/resumos/${item.id}`, { resumo, perguntas, idEvento });
  },
  compartilhar(item: ResumoConsulta) {
    return api.post<ResumoConsulta>(`/pets/${item.idPet}/sia/resumos/${item.id}/compartilhar`, {});
  },
  revogar(item: ResumoConsulta) {
    return api.delete<ResumoConsulta>(`/pets/${item.idPet}/sia/resumos/${item.id}/compartilhamento`);
  },
};
