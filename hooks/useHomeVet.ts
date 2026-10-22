import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useVet } from '../context/VetContext';
import { confirmar } from '../utils/alert';
import { mesmoDia } from '../utils/agendaVet';
import { parseDataEvento, statusExibicao } from '../utils/eventoStatus';
import { useAtendimentoVet } from './useAtendimentoVet';
import { useMeusResgates } from './useRecompensas';

/**
 * Regras da home do veterinário (mobile e desktop): próximo atendimento, atendimento em andamento,
 * resto do dia e o aviso ao iniciar. Centralizado aqui para as duas versões se comportarem igual.
 */
export function useHomeVet() {
  const router = useRouter();
  const { veterinarioAtivo, eventos, eventosAgendados, eventosDeHoje, pacientes, carregando } = useVet();
  const { data: resgates = [] } = useMeusResgates(true);
  const { atendimento, carregado: atendimentoCarregado, iniciar, encerrar } = useAtendimentoVet();

  const resgatesPendentes = resgates.filter(r => r.status === 'PENDENTE').length;
  const pacientesComPendencia = pacientes.filter(p => p.eventos.some(e => e.status === 'AGENDADO')).length;
  const atrasados = useMemo(() => eventos.filter(e => statusExibicao(e) === 'ATRASADO'), [eventos]);
  const concluidosHoje = eventosDeHoje.filter(e => e.status === 'CONCLUIDO').length;

  const agendadosOrdenados = useMemo(
    () => [...eventosAgendados].sort((a, b) => parseDataEvento(a.data).getTime() - parseDataEvento(b.data).getTime()),
    [eventosAgendados],
  );
  const eventoEmAndamento = atendimento ? eventosAgendados.find(e => String(e.id) === atendimento.eventoId) : undefined;
  // Só atendimentos já confirmados pela clínica podem ser iniciados (o backend recusa concluir os demais).
  const proximo = agendadosOrdenados.find(
    e => statusExibicao(e) !== 'ATRASADO' && e.statusConfirmacao !== 'PENDENTE' && e.statusConfirmacao !== 'RECUSADO',
  );
  const eventoHero = eventoEmAndamento ?? proximo;
  const emAtendimento = Boolean(eventoEmAndamento && atendimento);
  const podeIniciar = Boolean(proximo && mesmoDia(parseDataEvento(proximo.data), new Date()));
  const petDoEvento = (petId: number | string) => pacientes.find(p => String(p.pet.id) === String(petId))?.pet;
  const petProximo = eventoHero ? petDoEvento(eventoHero.petId) : undefined;

  const restoDoDia = useMemo(() => {
    const ids = new Set<string>();
    const lista = [...eventosDeHoje, ...atrasados].filter(e => {
      const chave = String(e.id);
      if (ids.has(chave) || (eventoHero && chave === String(eventoHero.id))) return false;
      ids.add(chave);
      return true;
    });
    return lista.sort((a, b) => parseDataEvento(a.data).getTime() - parseDataEvento(b.data).getTime()).slice(0, 5);
  }, [eventosDeHoje, atrasados, eventoHero]);

  // Se o atendimento em andamento foi concluído ou cancelado por outro caminho, limpa o estado local.
  useEffect(() => {
    if (!carregando && atendimentoCarregado && atendimento && !eventoEmAndamento) void encerrar();
  }, [carregando, atendimentoCarregado, atendimento, eventoEmAndamento, encerrar]);

  function pedirInicioAtendimento() {
    if (!proximo) return;
    const nomePet = petProximo?.nome ?? 'o paciente';
    confirmar(
      'Iniciar atendimento?',
      `Tudo o que você escrever no bloco de notas será adicionado à ficha de ${nomePet} ao concluir o atendimento. O tutor poderá ver essas informações.`,
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        {
          texto: 'Iniciar',
          aoConfirmar: () => {
            void iniciar({ eventoId: String(proximo.id), petId: String(proximo.petId) }).then(() =>
              router.push(`/atendimento/${proximo.id}`),
            );
          },
        },
      ],
    );
  }

  /** Ação do botão principal do card em destaque: continuar, iniciar (no dia) ou abrir a ficha. */
  function acionarHero() {
    if (!eventoHero) return;
    if (emAtendimento) router.push(`/atendimento/${eventoHero.id}`);
    else if (podeIniciar) pedirInicioAtendimento();
    else router.push(`/paciente/${eventoHero.petId}`);
  }

  return {
    carregando,
    veterinarioAtivo,
    eventosDeHoje,
    atrasados,
    concluidosHoje,
    pacientes,
    pacientesComPendencia,
    resgatesPendentes,
    atendimento,
    eventoHero,
    emAtendimento,
    podeIniciar,
    petProximo,
    petDoEvento,
    restoDoDia,
    acionarHero,
  };
}
