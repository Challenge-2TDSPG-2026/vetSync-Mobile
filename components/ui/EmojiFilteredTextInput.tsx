import React from 'react';
import { TextInput as NativeTextInput, type TextInputProps } from 'react-native';

const EMOJI_SEQUENCE = /(?:\u{1F3F4}(?:\u{E0061}-\u{E007E})+\u{E007F})|(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?(?:\p{Emoji_Modifier})?)*)|(?:\p{Regional_Indicator}{1,2})|(?:[#*0-9]\uFE0F?\u20E3)|\p{Emoji_Modifier}/gu;

export function removerEmojis(valor: string): string {
  return valor.replace(EMOJI_SEQUENCE, '');
}

export const EmojiFilteredTextInput = React.forwardRef<
  React.ElementRef<typeof NativeTextInput>,
  TextInputProps
>(function EmojiFilteredTextInput({ onChangeText, ...props }, ref) {
  return (
    <NativeTextInput
      {...props}
      ref={ref}
      onChangeText={texto => onChangeText?.(removerEmojis(texto))}
    />
  );
});
