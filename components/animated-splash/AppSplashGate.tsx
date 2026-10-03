import React, { useCallback, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePet } from '../../context/PetContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { AnimatedSplash } from './AnimatedSplash';

// Garante que a abertura aparece uma única vez por inicialização a frio,
// mesmo que o componente seja remontado (ex.: Fast Refresh, troca de sessão).
let jaExibida = false;

/**
 * Monta a abertura animada por cima da navegação (que continua carregando por baixo).
 * Deve ficar DENTRO dos providers de Auth, Pet e Accessibility.
 */
export function AppSplashGate() {
  const { sessao, carregando: carregandoAuth } = useAuth();
  const { carregando: carregandoPet } = usePet();
  const { carregando: carregandoAcessibilidade } = useAccessibility();
  const [visivel, setVisivel] = useState(!jaExibida);

  const ehTutor = sessao?.perfil === 'TUTOR';
  // Mesma regra de RootNavigator: só espera os pets quando o usuário é tutor.
  const pronto = !carregandoAuth && !carregandoAcessibilidade && !(ehTutor && carregandoPet);

  const aoFinalizar = useCallback(() => {
    jaExibida = true;
    setVisivel(false);
  }, []);

  if (!visivel) return null;
  return <AnimatedSplash pronto={pronto} onFinish={aoFinalizar} />;
}
