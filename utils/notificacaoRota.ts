export interface RotaNotificacao {
  pathname: string;
  params?: Record<string, string>;
}

/** Campos que podem vir em `notification.request.content.data` (push) ou na lista de notificações (API). */
export interface DadosNotificacao {
  tipo?: unknown;
  referenciaTipo?: unknown;
  referenciaId?: unknown;
  petId?: unknown;
  servicoId?: unknown;
  data?: unknown;
  hora?: unknown;
  rota?: unknown;
  planoPetId?: unknown;
  planoItemId?: unknown;
}

const SO_DIGITOS = /^\d{1,18}$/;
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const ROTA_PLANO = '/(tutor)/plano-preventivo';

function id(valor: unknown): string | null {
  if (typeof valor === 'number' && Number.isInteger(valor) && valor >= 0) return String(valor);
  if (typeof valor === 'string' && SO_DIGITOS.test(valor)) return valor;
  return null;
}

function texto(valor: unknown, regex: RegExp): string | null {
  return typeof valor === 'string' && regex.test(valor) ? valor : null;
}

/**
 * Decide para onde o toque numa notificação leva. O destino é montado a partir de `tipo` e ids
 * validados — nunca de uma rota livre vinda do payload — para que um push forjado não navegue
 * para telas arbitrárias.
 */
export function rotaDaNotificacao(dados: DadosNotificacao | null | undefined): RotaNotificacao | null {
  if (!dados) return null;
  const tipo = typeof dados.tipo === 'string' ? dados.tipo : null;
  const referenciaId = id(dados.referenciaId);

  if (tipo === 'VAGA_DISPONIVEL') {
    const params: Record<string, string> = {};
    const petId = id(dados.petId);
    const servicoId = id(dados.servicoId);
    // Sem pet/serviço (ex.: item da lista de notificações) a tela da lista de espera mostra a vaga.
    if (!petId || !servicoId) return { pathname: '/(tutor)/lista-espera' };
    const data = texto(dados.data, REGEX_DATA);
    const hora = texto(dados.hora, REGEX_HORA);
    if (petId) params.petId = petId;
    if (servicoId) params.servicoId = servicoId;
    if (data) params.data = data;
    if (hora) params.hora = hora;
    return { pathname: '/(tutor)/agendar-servico', params };
  }

  if (tipo === 'EVENTO_CONFIRMADO' || tipo === 'EVENTO_RECUSADO' || tipo === 'EVENTO_PROXIMO') {
    if (dados.referenciaTipo === 'EVENTO' && referenciaId) {
      return { pathname: '/evento/[id]', params: { id: referenciaId } };
    }
    return { pathname: '/(tutor)/(tabs)/agenda' };
  }

  // Lembretes do plano preventivo (item 1) são agendados localmente com essa rota fixa.
  if (dados.rota === ROTA_PLANO || id(dados.planoPetId)) {
    return { pathname: ROTA_PLANO };
  }

  return null;
}