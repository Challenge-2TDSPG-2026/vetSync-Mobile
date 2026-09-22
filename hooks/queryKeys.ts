export const petKeys = {
  all: ['pets'] as const,
  detalhe: (id: string) => ['pets', id] as const,
  listaPorIds: (ids: string[]) => ['pets', 'por-ids', ...ids] as const,
};
