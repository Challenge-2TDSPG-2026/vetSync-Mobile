/**
 * Texto que o veterinário escreve no atendimento e vai para a ficha do pet.
 * O backend grava a observação clínica em VARCHAR2(1000), que no Oracle conta BYTES (acentos = 2),
 * por isso o limite aqui é em bytes UTF-8 e inclui o cabeçalho com clínica, veterinário e horários.
 */
export const LIMITE_BYTES_OBSERVACAO = 1000;

export function bytesUtf8(texto: string): number {
  let total = 0;
  for (const caractere of texto) {
    const codigo = caractere.codePointAt(0) ?? 0;
    total += codigo < 0x80 ? 1 : codigo < 0x800 ? 2 : codigo < 0x10000 ? 3 : 4;
  }
  return total;
}

/** Corta o texto em no máximo `limite` bytes UTF-8, sem partir um caractere ao meio. */
export function cortarEmBytes(texto: string, limite: number): string {
  if (limite <= 0) return '';
  let total = 0;
  let resultado = '';
  for (const caractere of texto) {
    const bytes = bytesUtf8(caractere);
    if (total + bytes > limite) break;
    total += bytes;
    resultado += caractere;
  }
  return resultado;
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

export function formatarHora(data: Date): string {
  return `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

export function formatarData(data: Date): string {
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()}`;
}

export interface DadosCabecalhoAtendimento {
  clinica?: string | null;
  veterinario: string;
  inicio: Date;
  fim: Date;
}

export function montarCabecalho({ clinica, veterinario, inicio, fim }: DadosCabecalhoAtendimento): string {
  return [
    clinica ? `Atendimento • ${clinica}` : 'Atendimento',
    `Veterinário(a): ${veterinario}`,
    `Data: ${formatarData(inicio)} • Início: ${formatarHora(inicio)} • Término: ${formatarHora(fim)}`,
  ].join('\n');
}

export function montarObservacao(dados: DadosCabecalhoAtendimento, notas: string): string {
  const cabecalho = montarCabecalho(dados);
  const texto = notas.trim();
  return texto ? `${cabecalho}\n\n${texto}` : cabecalho;
}

/** Quantos bytes sobram para as notas depois do cabeçalho (o horário de término tem tamanho fixo). */
export function bytesDisponiveisParaNotas(dados: Omit<DadosCabecalhoAtendimento, 'fim'>): number {
  const cabecalho = montarCabecalho({ ...dados, fim: dados.inicio });
  return Math.max(0, LIMITE_BYTES_OBSERVACAO - bytesUtf8(`${cabecalho}\n\n`));
}

export function formatarDuracao(milissegundos: number): string {
  const totalSegundos = Math.max(0, Math.floor(milissegundos / 1000));
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return horas > 0
    ? `${horas}:${doisDigitos(minutos)}:${doisDigitos(segundos)}`
    : `${doisDigitos(minutos)}:${doisDigitos(segundos)}`;
}
