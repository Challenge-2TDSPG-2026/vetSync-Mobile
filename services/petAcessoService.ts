import { api } from './api/httpClient';

export type RelacaoPet = 'CUIDADOR' | 'CONJUGE' | 'OUTRO';
export type PermissaoPet = 'LEITURA' | 'EDICAO';

export interface ConvitePet {
  idConvite: string;
  email: string;
  nomePet: string;
  relacao: RelacaoPet;
  permissao: PermissaoPet;
  status: 'PENDENTE';
  expiraEm: string;
}

export interface AcessoPet {
  idAcesso: string;
  idTutor: string;
  nomeTutor: string;
  emailTutor: string;
  relacao: RelacaoPet;
  permissao: PermissaoPet;
  status: 'ATIVO' | 'REVOGADO';
  dtConcedido: string;
}

type ConvitePetApi = Omit<ConvitePet, 'idConvite'> & { idConvite: number };
type AcessoPetApi = Omit<AcessoPet, 'idAcesso' | 'idTutor'> & { idAcesso: number; idTutor: number };

function paraConviteApp(convite: ConvitePetApi): ConvitePet {
  return { ...convite, idConvite: String(convite.idConvite) };
}

function paraAcessoApp(acesso: AcessoPetApi): AcessoPet {
  return { ...acesso, idAcesso: String(acesso.idAcesso), idTutor: String(acesso.idTutor) };
}

/** Operações do proprietário para compartilhar o acesso a um pet. */
export const petAcessoService = {
  async criarConvite(idPet: string, dados: {
    email: string;
    relacao: RelacaoPet;
    permissao: PermissaoPet;
  }): Promise<ConvitePet> {
    const resposta = await api.post<ConvitePetApi>(`/pets/${idPet}/convites`, dados);
    return paraConviteApp(resposta);
  },

  async listarAcessos(idPet: string): Promise<AcessoPet[]> {
    const resposta = await api.get<AcessoPetApi[]>(`/pets/${idPet}/acessos`);
    return resposta.map(paraAcessoApp);
  },

  async revogarAcesso(idPet: string, idAcesso: string): Promise<void> {
    await api.delete(`/pets/${idPet}/acessos/${idAcesso}`);
  },
};
