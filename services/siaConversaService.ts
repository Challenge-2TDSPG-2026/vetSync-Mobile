import { api } from './api/httpClient';

export interface SiaConversaSalva { id: string; idPet: number; criadoEm: string; atualizadoEm: string }
export interface SiaMensagemSalva { id: number; autoria: 'TUTOR' | 'SIA'; texto: string; criadoEm: string }

const raiz = (petId: string) => `/pets/${encodeURIComponent(petId)}/sia/conversas`;

export const siaConversaService = {
  listar: (petId: string) => api.get<SiaConversaSalva[]>(raiz(petId)),
  criar: (petId: string) => api.post<SiaConversaSalva>(raiz(petId), {}),
  mensagens: (petId: string, conversaId: string) => api.get<SiaMensagemSalva[]>(`${raiz(petId)}/${encodeURIComponent(conversaId)}/mensagens`),
  adicionar: (petId: string, conversaId: string, autoria: 'TUTOR' | 'SIA', texto: string) =>
    api.post<SiaMensagemSalva>(`${raiz(petId)}/${encodeURIComponent(conversaId)}/mensagens`, { autoria, texto }),
};
