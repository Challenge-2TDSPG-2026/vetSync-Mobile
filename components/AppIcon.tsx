import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type IconSet = 'Ionicons' | 'MaterialCommunityIcons';

interface AppIconProps {
    name: string;
    set: IconSet;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
    /**
     * Rótulo acessível opcional. Só deve ser usado quando o ícone é o ÚNICO
     * conteúdo de um elemento interativo (ex.: um botão só com ícone) e não
     * há texto irmão descrevendo a ação — nesse caso, aplique este label no
     * próprio Pressable/TouchableOpacity, não aqui.
     * Por padrão o ícone é tratado como decorativo e escondido de leitores
     * de tela, evitando anúncios duplicados quando já existe um rótulo de
     * texto ao lado.
     */
    accessibilityLabel?: string;
}

export function AppIcon({ name, set, size = 22, color, style, accessibilityLabel }: AppIconProps) {
    const { theme } = useTheme();
    const resolvedColor = color ?? theme.colors.text;
    const a11yProps = accessibilityLabel
        ? { accessible: true, accessibilityLabel, accessibilityRole: 'image' as const }
        : { accessible: false, importantForAccessibility: 'no' as const };
    if (set === 'MaterialCommunityIcons') {
        return <MaterialCommunityIcons name={name as any} size={size} color={resolvedColor} style={style} {...a11yProps} />;
    }
    return <Ionicons name={name as any} size={size} color={resolvedColor} style={style} {...a11yProps} />;
}