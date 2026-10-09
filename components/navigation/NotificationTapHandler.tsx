import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import {
  obterToqueQueAbriuOApp,
  observarToquesEmNotificacao,
  type ToqueEmNotificacao,
} from '../../services/pushNotificationService';
import { rotaDaNotificacao } from '../../utils/notificacaoRota';

/**
 * Leva o tutor para a tela certa quando ele toca numa notificação (vaga aberta, agendamento
 * confirmado/recusado, lembrete do plano preventivo). Só age com o tutor autenticado.
 */
export function NotificationTapHandler() {
  const router = useRouter();
  const { sessao } = useAuth();
  const ehTutor = sessao?.perfil === 'TUTOR';
  const ultimoTratado = useRef<string | null>(null);

  useEffect(() => {
    if (!ehTutor) return;
    let ativo = true;

    function tratar(toque: ToqueEmNotificacao | null) {
      if (!ativo || !toque || ultimoTratado.current === toque.chave) return;
      ultimoTratado.current = toque.chave;
      const rota = rotaDaNotificacao(toque.dados);
      if (rota) router.push(rota as Parameters<typeof router.push>[0]);
    }

    void obterToqueQueAbriuOApp().then(tratar);
    const cancelar = observarToquesEmNotificacao(tratar);

    return () => {
      ativo = false;
      cancelar();
    };
  }, [ehTutor, router]);

  return null;
}