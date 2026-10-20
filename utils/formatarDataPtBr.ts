/** Formata datas vindas da API sem deslocar datas sem horário nem ocultar valores inválidos. */
export function formatarDataPtBr(
  valor: string | null | undefined,
  incluirHora = false,
): string | null {
  const entrada = valor?.trim();
  if (!entrada) return null;

  const somenteData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entrada);
  let data: Date;

  if (somenteData) {
    const [, ano, mes, dia] = somenteData;
    data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    if (
      data.getFullYear() !== Number(ano) ||
      data.getMonth() !== Number(mes) - 1 ||
      data.getDate() !== Number(dia)
    ) {
      return null;
    }
  } else {
    data = new Date(entrada);
    if (Number.isNaN(data.getTime())) return null;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...(incluirHora ? { timeStyle: 'short' as const } : {}),
  }).format(data);
}
