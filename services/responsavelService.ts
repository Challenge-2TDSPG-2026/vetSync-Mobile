import { api } from './api/httpClient';

export type PermissaoResponsavel = 'LEITURA' | 'EDICAO';

export interface ConviteResponsavel {
  idConvite: string;
  email: string;
  permissao: PermissaoResponsavel;
  status: 'PENDENTE';
  expiraEm: string;
}

export interface Responsavel {
  idResponsavel: string;
  idTutor: string;
  nome: string;
  email: string;
  permissao: PermissaoResponsavel;
  status: 'ATIVO' | 'REVOGADO';
  concedidoEm: string;
}

type ConviteResponsavelApi = Omit<ConviteResponsavel, 'idConvite'> & { idConvite: number };
type ResponsavelApi = Omit<Responsavel, 'idResponsavel' | 'idTutor'> & {
  idResponsavel: number;
  idTutor: number;
};

export const responsavelService = {
  async criarConvite(dados: {
    email: string;
    permissao: PermissaoResponsavel;
  }): Promise<ConviteResponsavel> {
    const resposta = await api.post<ConviteResponsavelApi>('/responsaveis/convites', dados);
    return { ...resposta, idConvite: String(resposta.idConvite) };
  },

  async listar(): Promise<Responsavel[]> {
    const resposta = await api.get<ResponsavelApi[]>('/responsaveis');
    return resposta.map((responsavel) => ({
      ...responsavel,
      idResponsavel: String(responsavel.idResponsavel),
      idTutor: String(responsavel.idTutor),
    }));
  },

  async revogar(idResponsavel: string): Promise<void> {
    await api.delete(`/responsaveis/${idResponsavel}`);
  },
};
