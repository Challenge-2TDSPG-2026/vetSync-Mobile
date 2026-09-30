import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from 'expo-router';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

/** Cores transversais ao produto. Superfícies de cartões vivem nos namespaces de página. */
export type GlobalThemeColors = {
  background: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  brandAccent: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  danger: string;
  dangerBackground: string;
  info: string;
  infoBackground: string;
  input: string;
  placeholder: string;
  overlay: string;
};

export type HeaderThemeColors = {
  background: string;
  backgroundAccent: string;
  title: string;
  icon: string;
  border: string;
  accountBackground: string;
  accountText: string;
  accountSubtext: string;
  accountIconBackground: string;
  accountIcon: string;
};

export type NavigationThemeColors = {
  background: string;
  activeBackground: string;
  activeIcon: string;
  inactiveIcon: string;
  activeText: string;
  inactiveText: string;
  badgeBackground: string;
  badgeText: string;
  badgeBorder: string;
  border: string;
};

/** Paleta tipada para páginas comuns; cada rota recebe sua própria instância. */
export type PageThemeColors = {
  background: string;
  heroBackground: string;
  heroAccent: string;
  heroText: string;
  white: string;
  card: string;
  cardSecondary: string;
  cardElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;
  danger: string;
  dangerBackground: string;
  info: string;
  infoBackground: string;
  input: string;
  placeholder: string;
  overlay: string;
};

export type HomeThemeColors = {
  background: string;
  petSelector: { background: string; selectedBackground: string; border: string; text: string; selectedText: string; icon: string };
  heroCard: { background: string; backgroundAccent: string; title: string; subtitle: string; iconBackground: string; icon: string; actionBackground: string; actionText: string; decoration: string };
  statsCard: { background: string; border: string; label: string; valueSuccess: string; valueWarning: string; valueDanger: string; divider: string };
  nextActionsCard: { background: string; title: string; text: string; iconBackground: string; icon: string; divider: string };
  petCard: { background: string; title: string; text: string; border: string; secondaryBackground: string; icon: string };
  eventCard: { background: string; border: string; title: string; text: string; divider: string };
};

export type VaccinationWalletThemeColors = {
  pageBackground: string;
  walletCard: { background: string; secondaryBackground: string; border: string; title: string; counter: string; petName: string; petInfo: string; iconBackground: string; photoBackground: string; icon: string; documentText: string; decoration: string; activeBadgeBackground: string; activeBadgeText: string };
  summaryCard: { background: string; border: string; divider: string; vaccineValue: string; completedValue: string; upcomingValue: string; label: string };
  nextVaccineCard: { background: string; iconBackground: string; icon: string; label: string; title: string; description: string; actionBackground: string; actionIcon: string };
  qrCard: { background: string; qrColor: string; iconBackground: string; icon: string; title: string; description: string; actionBackground: string; actionText: string };
  modal: PageThemeColors;
};

export type LoyaltyThemeColors = {
  pageBackground: string;
  heroCard: { background: string; backgroundAccent: string; iconBackground: string; icon: string; eyebrow: string; title: string; description: string; decoration: string };
  levelCard: { background: string; border: string; label: string; badgeBackground: string; badgeText: string; levelName: string; levelDescription: string; progressBackground: string; progressFill: string; remainingText: string; helperText: string };
  cycleCard: { background: string; border: string; title: string; counter: string; progressBackground: string; progressFill: string; description: string; emptyStep: string; completedStep: string };
  catalogCard: { background: string; border: string; title: string; description: string; iconBackground: string; actionBackground: string; actionText: string };
  statsCard: { background: string; divider: string; value: string; label: string };
  historyCard: { background: string; border: string; title: string; description: string };
  emptyCard: { background: string; border: string; title: string; description: string };
};

export type AgendaThemeColors = PageThemeColors & {
  filter: { background: string; border: string };
  calendar: { background: string; secondaryBackground: string; border: string };
  eventCard: { background: string; footerBackground: string; border: string };
  emptyState: { background: string; border: string; iconBackground: string };
};

export type AssistantThemeColors = PageThemeColors & {
  watermark: string;
  sheet: { background: string; border: string; borderStrong: string };
  suggestions: { background: string; rowBackground: string; border: string };
  messages: { assistantBackground: string; avatarBackground: string };
  composer: { background: string; fieldBackground: string; border: string };
};

export type VetDashboardThemeColors = PageThemeColors & {
  statsCard: { background: string; border: string };
  summaryCard: { background: string; border: string; divider: string };
  quickActionCard: { background: string; border: string };
  eventListCard: { background: string; headerBackground: string; border: string };
};

export type VetPatientsThemeColors = PageThemeColors & {
  searchField: { background: string; border: string };
  filterChip: { background: string; border: string };
  patientCard: { background: string; border: string };
};

export type HistoryThemeColors = PageThemeColors & {
  statsCard: { background: string; border: string };
  tableCard: { background: string; border: string };
};

export type PetDetailsThemeColors = PageThemeColors & {
  identityCard: { background: string; border: string };
  healthCard: { background: string; border: string };
  statsCard: { background: string; border: string };
  historyCard: { background: string; border: string };
  emptyState: { background: string; border: string };
};

export const DOMAIN_COLORS = {
  event: { vaccine: '#22a06b', deworming: '#9B59B6', consultation: '#2563eb', medication: '#e67e22', checkup: '#1ABC9C', other: '#7a6a5e', surgery: '#dc3545', grooming: '#2563eb' },
  eventStatus: { scheduled: { background: '#dbeafe', text: '#1e40af' }, completed: { background: '#dcfce7', text: '#166534' }, cancelled: { background: '#f3f4f6', text: '#4b5563' }, overdue: { background: '#fee2e2', text: '#991b1b' } },
  reward: { gold: '#c99a2e' },
} as const;

export type AppTheme = {
  mode: ResolvedTheme;
  colors: GlobalThemeColors;
  components: { header: HeaderThemeColors; navigation: NavigationThemeColors };
  pages: {
    home: HomeThemeColors;
    agenda: AgendaThemeColors;
    assistant: AssistantThemeColors;
    vaccinationWallet: VaccinationWalletThemeColors;
    loyalty: LoyaltyThemeColors;
    tutorProfile: PageThemeColors;
    notifications: PageThemeColors;
    history: HistoryThemeColors;
    vetDashboard: VetDashboardThemeColors;
    vetAppointments: PageThemeColors;
    vetAvailability: PageThemeColors;
    vetPatients: VetPatientsThemeColors;
    vetProfile: PageThemeColors;
    vetReports: PageThemeColors;
    vetRedemptions: PageThemeColors;
    petDetails: PetDetailsThemeColors;
    eventDetails: PageThemeColors;
    addPet: PageThemeColors;
    addEvent: PageThemeColors;
    manageAccess: PageThemeColors;
    simpleMode: PageThemeColors;
    authentication: PageThemeColors;
    shared: PageThemeColors;
  };
  domain: typeof DOMAIN_COLORS;
};

const globalLight: GlobalThemeColors = {
  background: '#fafaf8', text: '#1a1512', textSecondary: '#7a6a5e', textMuted: '#9b8e82',
  primary: '#0e3326', onPrimary: '#ffffff', brandAccent: '#f2c879', success: '#166534', successBackground: '#dcfce7',
  warning: '#e67e22', warningBackground: '#fef3c7', danger: '#dc3545', dangerBackground: '#fee2e2',
  info: '#2563eb', infoBackground: '#dbeafe', input: '#f9f7f4', placeholder: '#7a6a5e', overlay: 'rgba(10,34,24,0.5)',
};
const globalDark: GlobalThemeColors = {
  background: '#1c1c1c', text: '#f2f7f2', textSecondary: '#c2cec4', textMuted: '#91a092',
  primary: '#65d99a', onPrimary: '#092617', brandAccent: '#f2c879', success: '#62d88c', successBackground: '#123c24',
  warning: '#f5b942', warningBackground: '#49360d', danger: '#ff8585', dangerBackground: '#4b2024',
  info: '#85b8ff', infoBackground: '#19395d', input: '#303030', placeholder: '#a8b7aa', overlay: 'rgba(0,0,0,0.68)',
};

function page(colors: GlobalThemeColors, mode: ResolvedTheme): PageThemeColors {
  return {
    background: colors.background, heroBackground: mode === 'dark' ? '#183727' : '#0a2218', heroAccent: mode === 'dark' ? '#2c2c2c' : '#155c3f', heroText: mode === 'dark' ? '#f2f7f2' : '#ffffff', white: '#ffffff', card: mode === 'dark' ? '#202020' : '#ffffff',
    cardSecondary: mode === 'dark' ? '#292929' : '#f0ece5', cardElevated: mode === 'dark' ? '#303030' : '#ffffff',
    border: mode === 'dark' ? '#3a3a3a' : '#e8e2da', borderStrong: mode === 'dark' ? '#515151' : '#cfc4b8',
    text: colors.text, textSecondary: colors.textSecondary, textMuted: colors.textMuted, primary: colors.primary,
    onPrimary: colors.onPrimary, success: colors.success, successBackground: colors.successBackground,
    warning: colors.warning, warningBackground: colors.warningBackground, danger: colors.danger,
    dangerBackground: colors.dangerBackground, info: colors.info, infoBackground: colors.infoBackground,
    input: colors.input, placeholder: colors.placeholder, overlay: colors.overlay,
  };
}

function makeTheme(mode: ResolvedTheme): AppTheme {
  const colors = mode === 'dark' ? globalDark : globalLight;
  const basePage = page(colors, mode);
  const homeHeroBackground = mode === 'dark' ? '#183727' : '#0a2218';
  const homeHeroAccent = mode === 'dark' ? '#2c2c2c' : '#155c3f';
  const walletCardBackground = mode === 'dark' ? '#183727' : '#0a2218';
  const walletCardAccent = mode === 'dark' ? '#2c2c2c' : '#155c3f';
  const walletCardBadgeText = mode === 'dark' ? '#183727' : '#0a2218';
  const walletQrBackground = mode === 'dark' ? '#183727' : '#0a2218';
  const loyaltyHeroBackground = mode === 'dark' ? '#183727' : '#0a2218';
  const loyaltyHeroAccent = mode === 'dark' ? '#2c2c2c' : '#155c3f';
  const loyaltyPurple = mode === 'dark' ? '#b59be4' : '#6d4aa8';
  const loyaltyLevelBackground = mode === 'dark' ? '#57416f' : '#eee5f7';
  const loyaltyLevelBorder = mode === 'dark' ? '#9a7abe' : '#d2c1e6';
  const loyaltyLevelText = mode === 'dark' ? '#f2f7f2' : colors.text;
  const loyaltyLevelSecondaryText = mode === 'dark' ? '#d5c8e4' : colors.textSecondary;
  const loyaltyLevelProgressBackground = mode === 'dark' ? '#49365e' : '#e2d7ef';
  const loyaltyLevelProgressFill = mode === 'dark' ? '#c9b1e8' : loyaltyPurple;
  const loyaltyLevelBadgeText = mode === 'dark' ? '#261b35' : '#ffffff';
  const home: HomeThemeColors = {
    background: colors.background,
    petSelector: { background: mode === 'dark' ? '#292929' : '#f5f5f5', selectedBackground: mode === 'dark' ? '#3a3a3a' : '#e6e6e6', border: basePage.border, text: colors.textSecondary, selectedText: colors.text, icon: mode === 'dark' ? '#252525' : '#333333' },
    heroCard: { background: homeHeroBackground, backgroundAccent: homeHeroAccent, title: '#ffffff', subtitle: '#ffffff', iconBackground: colors.primary, icon: colors.onPrimary, actionBackground: mode === 'dark' ? '#2c2c2c' : '#155c3f', actionText: '#ffffff', decoration: mode === 'dark' ? 'rgba(101,217,154,0.12)' : 'rgba(21,92,63,0.18)' },
    statsCard: { background: basePage.card, border: basePage.border, label: colors.textSecondary, valueSuccess: colors.success, valueWarning: colors.warning, valueDanger: colors.danger, divider: basePage.border },
    nextActionsCard: { background: basePage.card, title: colors.text, text: colors.textSecondary, iconBackground: basePage.cardSecondary, icon: colors.primary, divider: basePage.border },
    petCard: { background: mode === 'dark' ? '#292929' : '#f0ece5', title: colors.text, text: colors.primary, border: basePage.border, secondaryBackground: mode === 'dark' ? '#303030' : '#ffffff', icon: colors.primary },
    eventCard: { background: basePage.card, border: basePage.border, title: colors.text, text: colors.textSecondary, divider: basePage.border },
  };
  const wallet: VaccinationWalletThemeColors = {
    pageBackground: colors.background,
    walletCard: { background: walletCardBackground, secondaryBackground: walletCardAccent, border: mode === 'dark' ? '#65d99a' : '#155c3f', title: '#ffffff', counter: mode === 'dark' ? '#c2cec4' : '#d4f2e4', petName: '#ffffff', petInfo: '#d4f2e4', iconBackground: mode === 'dark' ? '#202020' : '#ffffff', photoBackground: mode === 'dark' ? '#292929' : '#f0ece5', icon: '#ffffff', documentText: '#ffffff', decoration: mode === 'dark' ? 'rgba(190,190,190,0.045)' : 'rgba(60,60,60,0.05)', activeBadgeBackground: '#ffffff', activeBadgeText: walletCardBadgeText },
    summaryCard: { background: basePage.card, border: basePage.border, divider: basePage.border, vaccineValue: colors.primary, completedValue: colors.success, upcomingValue: colors.warning, label: colors.textSecondary },
    nextVaccineCard: { background: basePage.card, iconBackground: colors.successBackground, icon: colors.primary, label: colors.primary, title: colors.text, description: colors.textSecondary, actionBackground: basePage.cardSecondary, actionIcon: colors.primary },
    qrCard: { background: walletQrBackground, qrColor: walletQrBackground, iconBackground: colors.primary, icon: '#ffffff', title: '#ffffff', description: '#ffffff', actionBackground: mode === 'dark' ? '#303030' : '#ffffff', actionText: colors.primary },
    modal: { ...basePage, card: basePage.cardElevated },
  };
  const loyalty: LoyaltyThemeColors = {
    pageBackground: colors.background,
    heroCard: { background: loyaltyHeroBackground, backgroundAccent: loyaltyHeroAccent, iconBackground: colors.primary, icon: '#ffffff', eyebrow: '#ffffff', title: '#ffffff', description: '#ffffff', decoration: mode === 'dark' ? 'rgba(190,190,190,0.045)' : 'rgba(60,60,60,0.05)' },
    levelCard: { background: loyaltyLevelBackground, border: loyaltyLevelBorder, label: mode === 'dark' ? '#e2d0f4' : loyaltyPurple, badgeBackground: loyaltyPurple, badgeText: loyaltyLevelBadgeText, levelName: loyaltyLevelText, levelDescription: loyaltyLevelSecondaryText, progressBackground: loyaltyLevelProgressBackground, progressFill: loyaltyLevelProgressFill, remainingText: loyaltyLevelText, helperText: loyaltyLevelSecondaryText },
    cycleCard: { background: basePage.card, border: basePage.border, title: colors.textSecondary, counter: colors.primary, progressBackground: basePage.cardSecondary, progressFill: colors.primary, description: colors.textSecondary, emptyStep: basePage.cardSecondary, completedStep: colors.primary },
    catalogCard: { background: basePage.card, border: basePage.border, title: colors.text, description: colors.textSecondary, iconBackground: basePage.cardSecondary, actionBackground: colors.primary, actionText: colors.onPrimary },
    statsCard: { background: basePage.card, divider: basePage.border, value: colors.primary, label: colors.textSecondary },
    historyCard: { background: basePage.card, border: basePage.border, title: colors.text, description: colors.textSecondary },
    emptyCard: { background: basePage.card, border: basePage.border, title: colors.text, description: colors.textSecondary },
  };
  const header: HeaderThemeColors = { background: mode === 'dark' ? '#252525' : '#0a2218', backgroundAccent: mode === 'dark' ? '#2c2c2c' : '#155c3f', title: mode === 'dark' ? '#f2f7f2' : '#ffffff', icon: mode === 'dark' ? '#f2f7f2' : '#ffffff', border: mode === 'dark' ? '#3a3a3a' : 'rgba(191, 233, 213, 0.18)', accountBackground: 'rgba(255,255,255,0.10)', accountText: mode === 'dark' ? '#f2f7f2' : '#ffffff', accountSubtext: mode === 'dark' ? '#f2f7f2' : '#ffffff', accountIconBackground: mode === 'dark' ? '#292929' : '#f0ece5', accountIcon: mode === 'dark' ? '#252525' : '#0a2218' };
  const navigation: NavigationThemeColors = { background: mode === 'dark' ? '#252525' : '#ffffff', activeBackground: mode === 'dark' ? '#65d99a' : '#0e3326', activeIcon: mode === 'dark' ? '#092617' : '#ffffff', inactiveIcon: colors.textSecondary, activeText: colors.primary, inactiveText: colors.textSecondary, badgeBackground: colors.danger, badgeText: '#ffffff', badgeBorder: mode === 'dark' ? '#252525' : '#ffffff', border: mode === 'dark' ? '#3a3a3a' : '#e8e2da' };
  const agendaPage = page(colors, mode);
  const agenda: AgendaThemeColors = {
    ...agendaPage,
    filter: { background: agendaPage.card, border: agendaPage.border },
    calendar: { background: agendaPage.card, secondaryBackground: agendaPage.cardSecondary, border: agendaPage.border },
    eventCard: { background: agendaPage.card, footerBackground: agendaPage.cardSecondary, border: agendaPage.border },
    emptyState: { background: agendaPage.card, border: agendaPage.border, iconBackground: colors.infoBackground },
  };
  const assistantPage = page(colors, mode);
  const assistant: AssistantThemeColors = {
    ...assistantPage,
    watermark: mode === 'dark' ? 'rgba(190,190,190,0.045)' : 'rgba(60,60,60,0.05)',
    sheet: { background: assistantPage.cardElevated, border: assistantPage.border, borderStrong: assistantPage.borderStrong },
    suggestions: { background: assistantPage.cardSecondary, rowBackground: assistantPage.card, border: assistantPage.border },
    messages: { assistantBackground: assistantPage.cardSecondary, avatarBackground: assistantPage.cardSecondary },
    composer: { background: assistantPage.card, fieldBackground: assistantPage.cardSecondary, border: assistantPage.border },
  };
  const vetDashboardPage = page(colors, mode);
  const vetDashboard: VetDashboardThemeColors = {
    ...vetDashboardPage,
    statsCard: { background: vetDashboardPage.card, border: vetDashboardPage.border },
    summaryCard: { background: vetDashboardPage.card, border: vetDashboardPage.border, divider: vetDashboardPage.border },
    quickActionCard: { background: vetDashboardPage.card, border: vetDashboardPage.border },
    eventListCard: { background: vetDashboardPage.card, headerBackground: vetDashboardPage.cardSecondary, border: vetDashboardPage.border },
  };
  const vetPatientsPage = page(colors, mode);
  const vetPatients: VetPatientsThemeColors = {
    ...vetPatientsPage,
    searchField: { background: vetPatientsPage.card, border: vetPatientsPage.border },
    filterChip: { background: vetPatientsPage.card, border: vetPatientsPage.border },
    patientCard: { background: vetPatientsPage.card, border: vetPatientsPage.border },
  };
  const historyPage = page(colors, mode);
  const history: HistoryThemeColors = {
    ...historyPage,
    statsCard: { background: historyPage.card, border: historyPage.border },
    tableCard: { background: historyPage.card, border: historyPage.border },
  };
  const petDetailsPage = page(colors, mode);
  const petDetails: PetDetailsThemeColors = {
    ...petDetailsPage,
    identityCard: { background: petDetailsPage.card, border: petDetailsPage.border },
    healthCard: { background: petDetailsPage.card, border: petDetailsPage.border },
    statsCard: { background: petDetailsPage.card, border: petDetailsPage.border },
    historyCard: { background: petDetailsPage.card, border: petDetailsPage.border },
    emptyState: { background: petDetailsPage.card, border: petDetailsPage.border },
  };
  return {
    mode, colors, components: { header, navigation },
    pages: {
      home, agenda, assistant,
      vaccinationWallet: wallet, loyalty,
      tutorProfile: page(colors, mode), notifications: page(colors, mode), history, vetDashboard,
      vetAppointments: page(colors, mode), vetAvailability: page(colors, mode), vetPatients, vetProfile: page(colors, mode),
      vetReports: page(colors, mode), vetRedemptions: page(colors, mode), petDetails, eventDetails: page(colors, mode),
      addPet: page(colors, mode), addEvent: page(colors, mode), manageAccess: page(colors, mode), simpleMode: page(colors, mode),
      authentication: page(colors, mode), shared: page(colors, mode),
    },
    domain: DOMAIN_COLORS,
  };
}

export const lightTheme = makeTheme('light');
export const darkTheme = makeTheme('dark');

export function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (!match) return color;
  const hex = match[1].length === 3 ? [...match[1]].map(char => char + char).join('') : match[1];
  const channels = hex.match(/.{2}/g)!.map(channel => Number.parseInt(channel, 16));
  const opacity = Math.max(0, Math.min(1, alpha));
  return `rgba(${channels[0]},${channels[1]},${channels[2]},${opacity})`;
}

export function createNavigationTheme(theme: AppTheme): NavigationTheme {
  const baseTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...baseTheme,
    dark: theme.mode === 'dark',
    colors: { ...baseTheme.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.background, text: theme.colors.text, border: theme.components.navigation.border, notification: theme.colors.danger },
  };
}
