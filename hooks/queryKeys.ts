export const petKeys = {
  all: ['pets'] as const,
  detalhe: (id: string) => ['pets', id] as const,
  listaPorIds: (ids: string[]) => ['pets', 'por-ids', ...ids] as const,
  perfilSaude: (id: string) => ['pets', id, 'perfil-saude'] as const,
};

export const prontuarioKeys = {
  /** Tudo do prontuário de um pet: invalidar esta chave atualiza consulta, exames e links. */
  raiz: (idPet: string) => ['pets', idPet, 'prontuario'] as const,
  consulta: (idPet: string, filtros: string) => ['pets', idPet, 'prontuario', 'consulta', filtros] as const,
  compartilhamentos: (idPet: string) => ['pets', idPet, 'prontuario', 'compartilhamentos'] as const,
  orientacoes: (idEvento: string) => ['eventos', idEvento, 'orientacoes'] as const,
};
