import { Platform, useWindowDimensions } from 'react-native';

/** Largura mínima (px) para usar o layout desktop do veterinário. */
export const VET_DESKTOP_BREAKPOINT = 1024;

/** Layout desktop do veterinário: só na web e em janelas largas. Mobile e tutor não são afetados. */
export function useVetDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= VET_DESKTOP_BREAKPOINT;
}