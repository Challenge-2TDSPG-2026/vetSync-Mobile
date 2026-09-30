import { api } from './api/httpClient';

export type SessaoVinculoClinica = {
  sessaoVinculo: string;
  idClinica: number;
  nomeClinica: string;
  expiraEm: string;
};

export type VinculoClinica = {
  idClinica: number;
  nomeClinica: string;
  inicio: string;
  ativo: boolean;
};

export const vinculoClinicaService = {
  validarCodigo(codigo: string) {
    return api.post<SessaoVinculoClinica>(
      '/vinculos-clinica/validar-codigo',
      { codigo: codigo.trim() },
      false,
    );
  },

  trocar(sessaoVinculo: string) {
    return api.post<VinculoClinica>('/vinculos-clinica/trocar', { codigo: sessaoVinculo });
  },

  obterAtual() {
    return api.get<VinculoClinica>('/vinculos-clinica/me');
  },
};
