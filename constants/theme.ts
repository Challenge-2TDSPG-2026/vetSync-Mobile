import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from 'expo-router';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  primary: string;
  onPrimary: string;
  input: string;
  placeholder: string;
  overlay: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  danger: string;
  dangerBackground: string;
  info: string;
  infoBackground: string;
  navigation: string;
  navigationAccent: string;
  onNavigation: string;
  navigationBorder: string;
};

/** Cores de domínio estáveis entre temas: eventos e recompensas. */
export const DOMAIN_COLORS = {
  event: {
    vaccine: '#22a06b',
    deworming: '#9B59B6',
    consultation: '#2563eb',
    medication: '#e67e22',
    checkup: '#1ABC9C',
  },
  reward: {
    gold: '#c99a2e',
    purple: '#6d4aa8',
  },
} as const;

export type AppTheme = {
  mode: ResolvedTheme;
  colors: ThemeColors;
  domain: typeof DOMAIN_COLORS;
};

const lightColors: ThemeColors = {
  background: '#fafaf8',
  surface: '#ffffff',
  surfaceSubtle: '#f0ece5',
  surfaceElevated: '#ffffff',
  text: '#1a1512',
  textSecondary: '#7a6a5e',
  textMuted: '#9b8e82',
  border: '#e8e2da',
  borderStrong: '#cfc4b8',
  primary: '#0e3326',
  onPrimary: '#ffffff',
  input: '#f9f7f4',
  placeholder: '#7a6a5e',
  overlay: 'rgba(10,34,24,0.5)',
  success: '#166534',
  successBackground: '#dcfce7',
  warning: '#e67e22',
  warningBackground: '#fef3c7',
  danger: '#dc3545',
  dangerBackground: '#fee2e2',
  info: '#2563eb',
  infoBackground: '#dbeafe',
  navigation: '#0a2218',
  navigationAccent: '#155c3f',
  onNavigation: '#ffffff',
  navigationBorder: 'rgba(191, 233, 213, 0.18)',
};

const darkColors: ThemeColors = {
  background: '#101512',
  surface: '#17211b',
  surfaceSubtle: '#203027',
  surfaceElevated: '#25362c',
  text: '#f2f7f2',
  textSecondary: '#c2cec4',
  textMuted: '#91a092',
  border: '#33463a',
  borderStrong: '#4b6251',
  primary: '#54c98a',
  onPrimary: '#062115',
  input: '#203027',
  placeholder: '#a8b7aa',
  overlay: 'rgba(0,0,0,0.68)',
  success: '#62d88c',
  successBackground: '#123c24',
  warning: '#f5b942',
  warningBackground: '#49360d',
  danger: '#ff8585',
  dangerBackground: '#4b2024',
  info: '#85b8ff',
  infoBackground: '#19395d',
  navigation: '#0d1711',
  navigationAccent: '#183727',
  onNavigation: '#f2f7f2',
  navigationBorder: '#365341',
};

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: lightColors,
  domain: DOMAIN_COLORS,
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: darkColors,
  domain: DOMAIN_COLORS,
};

/** Retorna o tema de navegação alinhado aos tokens semânticos do VetSync. */
export function createNavigationTheme(theme: AppTheme): NavigationTheme {
  const baseTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...baseTheme,
    dark: theme.mode === 'dark',
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}

/**
 * Compatibilidade temporária para telas que ainda usam CORES. Novos
 * componentes devem consumir useTheme() e seus tokens semânticos.
 */
export const CORES = {
  primaria: lightTheme.colors.primary,
  secundaria: '#22a06b',
  destaque: '#3db87e',
  alerta: lightTheme.colors.danger,
  aviso: lightTheme.colors.warning,
  info: lightTheme.colors.info,
  fundo: lightTheme.colors.background,
  fundoCard: lightTheme.colors.surface,
  fundoSutil: lightTheme.colors.surfaceSubtle,
  texto: lightTheme.colors.text,
  textoSecundario: lightTheme.colors.textSecondary,
  borda: lightTheme.colors.border,
  success: lightTheme.colors.success,
  successBg: lightTheme.colors.successBackground,
  alertaBg: lightTheme.colors.dangerBackground,
  avisoBg: lightTheme.colors.warningBackground,
  infoBg: lightTheme.colors.infoBackground,
} as const;
