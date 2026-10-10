import { ApiError } from '../services/api/httpClient';
import type { PendenciaSocial } from '../services/authService';

export type DestinoPendencia =
  | { acao: 'CADASTRAR' }
  | { acao: 'VINCULAR' }
  | { acao: 'BLOQUEAR'; mensagem: string };

/** Decide o que o app faz quando o Google foi validado, mas ainda não há sessão VetSync. */
export function destinoDaPendencia(pendencia: PendenciaSocial): DestinoPendencia {
  switch (pendencia.status) {
    case 'VINCULO_NECESSARIO':
      return { acao: 'VINCULAR' };
    case 'EMAIL_EM_USO':
      return {
        acao: 'BLOQUEAR',
        mensagem:
          'Este e-mail pertence a uma conta de clínica ou veterinário e não pode usar o Google. Entre com e-mail e senha.',
      };
    case 'CADASTRO_NECESSARIO':
      if (!pendencia.email || !pendencia.emailVerificado) {
        return {
          acao: 'BLOQUEAR',
          mensagem:
            'O Google não confirmou o e-mail desta conta. Use outra conta do Google ou cadastre-se com e-mail e senha.',
        };
      }
      return { acao: 'CADASTRAR' };
    default:
      return {
        acao: 'BLOQUEAR',
        mensagem: 'Não foi possível concluir o login com o Google. Tente novamente.',
      };
  }
}

/** true quando a API recusou o id_token (inválido ou expirado), e não a senha digitada. */
export function erroDeTokenGoogle(erro: unknown): boolean {
  return erro instanceof ApiError && erro.status === 401 && /token de identidade/i.test(erro.message);
}
