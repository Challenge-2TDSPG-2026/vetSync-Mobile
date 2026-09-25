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
}

export function AppIcon({ name, set, size = 22, color, style }: AppIconProps) {
    const { theme } = useTheme();
    const resolvedColor = color ?? theme.colors.text;
    if (set === 'MaterialCommunityIcons') {
        return <MaterialCommunityIcons name={name as any} size={size} color={resolvedColor} style={style} />;
    }
    return <Ionicons name={name as any} size={size} color={resolvedColor} style={style} />;
}
