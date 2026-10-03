/**
 * Funções puras (worklets) de tempo e curvas. Não dependem de Easing do Reanimated
 * para rodar com segurança na thread de UI.
 */
export type Intervalo = readonly [number, number];
export type Curva = 'saida' | 'suave' | 'entrada' | 'linear';

export function curva(x: number, tipo: Curva): number {
  'worklet';
  if (tipo === 'saida') {
    const y = 1 - x;
    return 1 - y * y * y;
  }
  if (tipo === 'entrada') return x * x * x;
  if (tipo === 'suave') return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  return x;
}

/** Progresso 0→1 de uma etapa dentro do relógio `t` (ms), com a curva escolhida. */
export function fase(t: number, intervalo: Intervalo, tipo: Curva = 'saida'): number {
  'worklet';
  const inicio = intervalo[0];
  const fim = intervalo[1];
  if (t <= inicio) return 0;
  if (t >= fim) return 1;
  return curva((t - inicio) / (fim - inicio), tipo);
}

/** Pulso 0→1→0 numa janela [inicio, inicio + duracao] (batida de coração). */
export function batida(t: number, inicio: number, duracao: number): number {
  'worklet';
  if (t <= inicio || t >= inicio + duracao) return 0;
  return Math.sin((Math.PI * (t - inicio)) / duracao);
}
