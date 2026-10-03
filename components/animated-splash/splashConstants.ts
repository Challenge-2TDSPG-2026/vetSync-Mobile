/**
 * Constantes da abertura animada do VetSync ("Sincronia").
 * Altere SPLASH_CONFIG para ajustar duração, tempo máximo de espera e cores.
 */
export const SPLASH_CONFIG = {
  /** Duração da fase de entrada, em ms (deve cobrir o fim de TIMELINE.final). */
  duracaoIntroMs: 2800,
  /** Duração do fade-out final para a interface, em ms. */
  duracaoSaidaMs: 600,
  /** Tempo máximo esperando o app carregar antes de liberar a interface (fallback). */
  tempoMaximoEsperaMs: 8000,
} as const;

/** Mesmas cores do tema global (constants/theme.ts → primary / brandAccent). */
export const SPLASH_COLORS = {
  fundo: '#0e3326',
  fundoGradiente: '#17503c',
  destaque: '#f2c879',
  texto: '#ffffff',
} as const;

export const SPLASH_LOGO = require('../../assets/logo.png');
export const LOGO_ASPECTO = 559 / 447; // altura / largura do assets/logo.png

/**
 * Linha do tempo (ms).
 * Duas orbes (tutor e veterinário) cruzam a tela e se encontram no centro (~1050 ms),
 * o logo floresce e "bate" como um coração (1500 e 1700 ms), emitindo ondas.
 */
export const TIMELINE = {
  fundo: [0, 350],
  orbes: [100, 1050],
  logo: [1000, 1650],
  batidas: [1500, 1700],
  nome: [1750, 2400],
  orbita: [1150, 2500],
  final: [2300, 2800],
} as const;

export const QTD_RASTRO = 7;
export const QTD_PONTOS_ORBITA = 18;
