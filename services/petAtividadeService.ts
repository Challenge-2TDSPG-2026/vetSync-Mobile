import { api } from './api/httpClient';

export type TipoAtividadePet =
  | 'CONVITE_ENVIADO'
  | 'CONVITE_ACEITO'
  | 'ACESSO_CONCEDIDO'
  | 'ACESSO_REVOGADO'
  | 'PET_ATUALIZADO'
  | 'EVENTO_AGENDADO'
  | 'EVENTO_CONCLUIDO'
  | 'EVENTO_CANCELADO'
  | 'PRONTUARIO_VISUALIZADO'
  | 'OUTRO';

export interface AtividadePet {
  idAtividade: string;
  tipo: TipoAtividadePet;
  descricao: string;
  autorNome: string;
  dtAtividade: string;
}

interface AtividadePetApi {
  idAtividade: number | string;
  tipo: string;
  descricao?: string | null;
  autorNome?: string | null;
  dtAtividade: string;
}

const TIPOS_CONHECIDOS: readonly TipoAtividadePet[] = [
  'CONVITE_ENVIADO',
  'CONVITE_ACEITO',
  'ACESSO_CONCEDIDO',
  'ACESSO_REVOGADO',
  'PET_ATUALIZADO',
  'EVENTO_AGENDADO',
  'EVENTO_CONCLUIDO',
  'EVENTO_CANCELADO',
  'PRONTUARIO_VISUALIZADO',
];

export function paraAtividadeApp(item: AtividadePetApi): AtividadePet {
  const tipo = TIPOS_CONHECIDOS.find((t) => t === item.tipo) ?? 'OUTRO';
  return {
    idAtividade: String(item.idAtividade),
    tipo,
    descricao: item.descricao?.trim() || 'Alteração registrada',
    autorNome: item.autorNome?.trim() || 'Alguém com acesso',
    dtAtividade: item.dtAtividade,
  };
}

/**
 * Histórico de atividade de um pet (quem fez o quê).
 * Endpoint: GET /pets/:id/atividades?limite=N — ver api_endpoints.md, seção 9.
 */
export const petAtividadeService = {
  async listar(idPet: string, limite = 30): Promise<AtividadePet[]> {
    const resposta = await api.get<AtividadePetApi[]>(`/pets/${idPet}/atividades?limite=${limite}`);
    return resposta
      .map(paraAtividadeApp)
      .sort((a, b) => new Date(b.dtAtividade).getTime() - new Date(a.dtAtividade).getTime());
  },
};
