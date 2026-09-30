import { api } from './api/httpClient';

type TutorResponseApi = {
  idTutor: number;
  nmTutor: string;
  dsEmail: string;
  nrTelefone: string | null;
  dsCpf: string;
  nrCep: string | null;
  dsLogradouro: string | null;
  nrEndereco: string | null;
  dsComplemento: string | null;
  dsBairro: string | null;
  nmCidade: string | null;
  sgUf: string | null;
};

export type DadosTutor = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type AtualizarTutorPayload = Omit<DadosTutor, 'id' | 'email' | 'cpf'>;

function texto(valor: string | null | undefined): string {
  return valor?.trim() ?? '';
}

function paraDadosTutor(dto: TutorResponseApi): DadosTutor {
  return {
    id: String(dto.idTutor),
    nome: dto.nmTutor,
    email: dto.dsEmail,
    telefone: texto(dto.nrTelefone),
    cpf: dto.dsCpf,
    cep: texto(dto.nrCep),
    logradouro: texto(dto.dsLogradouro),
    numero: texto(dto.nrEndereco),
    complemento: texto(dto.dsComplemento),
    bairro: texto(dto.dsBairro),
    cidade: texto(dto.nmCidade),
    uf: texto(dto.sgUf),
  };
}

export const tutorService = {
  async buscarPorId(id: number | string): Promise<DadosTutor> {
    const resposta = await api.get<TutorResponseApi>(`/tutores/${id}`);
    return paraDadosTutor(resposta);
  },

  async atualizar(id: number | string, dados: AtualizarTutorPayload): Promise<DadosTutor> {
    const resposta = await api.put<TutorResponseApi>(`/tutores/${id}`, {
      nmTutor: dados.nome.trim(),
      nrTelefone: dados.telefone.replace(/\D/g, '') || null,
      nrCep: dados.cep.replace(/\D/g, ''),
      dsLogradouro: dados.logradouro.trim(),
      nrEndereco: dados.numero.trim(),
      dsComplemento: dados.complemento.trim() || null,
      dsBairro: dados.bairro.trim(),
      nmCidade: dados.cidade.trim(),
      sgUf: dados.uf.trim().toUpperCase(),
    });
    return paraDadosTutor(resposta);
  },
};
