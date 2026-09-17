import { Text, TextInput } from 'react-native';

/**
 * Trava a escala de fonte do app, ignorando a configuração de "Tamanho da fonte"
 * do sistema operacional (Android/iOS). Sem isso, o texto do app inteiro
 * cresceria ou encolheria de acordo com a acessibilidade do aparelho, o que
 * conflita com nosso próprio controle de tamanho (modo padrão / modo simples).
 *
 * Não afeta o "Tamanho de exibição" (zoom de densidade do Android) — essa
 * configuração atua abaixo do React Native e não é interceptável em JS puro;
 * travá-la exigiria código nativo Android e sairia do Expo Go.
 *
 * Chamado uma única vez, o mais cedo possível (em app/_layout.tsx).
 */
export function lockFontScaling() {
    // @ts-ignore — defaultProps existe em runtime mesmo sem tipagem oficial
    Text.defaultProps = Text.defaultProps || {};
    // @ts-ignore
    Text.defaultProps.allowFontScaling = false;
    // @ts-ignore
    Text.defaultProps.maxFontSizeMultiplier = 1;

    // @ts-ignore
    TextInput.defaultProps = TextInput.defaultProps || {};
    // @ts-ignore
    TextInput.defaultProps.allowFontScaling = false;
    // @ts-ignore
    TextInput.defaultProps.maxFontSizeMultiplier = 1;
}