import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../../context/ThemeContext';

export function OfflineBanner() {
  const { theme } = useTheme();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    const atualizar = (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
      if (!mounted) return;
      setOffline(state.isConnected === false || state.isInternetReachable === false);
    };
    const unsubscribe = NetInfo.addEventListener(atualizar);
    void NetInfo.fetch().then(atualizar);
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') void NetInfo.fetch().then(atualizar);
    });
    return () => {
      mounted = false;
      unsubscribe();
      appState.remove();
    };
  }, []);

  if (!offline) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.warningBackground }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: theme.colors.warning }]}>
        Você está sem conexão. Os dados exibidos podem estar desatualizados.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' },
  text: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
