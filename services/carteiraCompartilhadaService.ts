import { api } from './api/httpClient';

export interface CarteiraCompartilhadaAtiva {
  id: string;
  criadaEm?: string;
  expiraEm: string;
  ultimoAcessoEm?: string | null;
}

export interface CarteiraCompartilhadaCriada {
  id: string;
  urlPublica: string;
  expiraEm: string;
}

interface CarteiraAtivaResponseApi {
  id: number;
  criadaEm: string;
  expiraEm: string;
  ultimoAcessoEm: string | null;
}

interface CarteiraCriadaResponseApi {
  id: number;
  urlPublica: string;
  expiraEm: string;
}

function paraCarteiraAtiva(dto: CarteiraAtivaResponseApi): CarteiraCompartilhadaAtiva {
  return {
    id: String(dto.id),
    criadaEm: dto.criadaEm,
    expiraEm: dto.expiraEm,
    ultimoAcessoEm: dto.ultimoAcessoEm,
  };
}

/**
 * A URL pública só é devolvida pelo backend na criação. Por isso ela deve
 * permanecer em memória na tela e nunca ser persistida no dispositivo.
 */
export const carteiraCompartilhadaService = {
  async buscarAtiva(idPet: string): Promise<CarteiraCompartilhadaAtiva> {
    const dto = await api.get<CarteiraAtivaResponseApi>(`/pets/${idPet}/carteira-compartilhavel`);
    return paraCarteiraAtiva(dto);
  },

  async criarOuRenovar(idPet: string): Promise<CarteiraCompartilhadaCriada> {
    const dto = await api.post<CarteiraCriadaResponseApi>(`/pets/${idPet}/carteira-compartilhavel`);
    return {
      id: String(dto.id),
      expiraEm: dto.expiraEm,
      urlPublica: dto.urlPublica,
    };
  },

  async revogar(idPet: string, idCarteira: string): Promise<void> {
    await api.delete(`/pets/${idPet}/carteira-compartilhavel/${idCarteira}`);
  },
};
