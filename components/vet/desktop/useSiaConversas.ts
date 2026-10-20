import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '../../../services/api/httpClient';
import { iaService, type SiaBlock, type SiaBlockOption } from '../../../services/iaService';

export type Mensagem = {
  id: number;
  autoria: 'usuario' | 'sia';
  texto: string;
  hora: string;
  erro?: boolean;
  bloco?: SiaBlock;
  acao?: { id: string; resumo: string; requerConfirmacao: boolean };
};

export type Conversa = {
  id: string;
  titulo: string;
  atualizadaEm: string;
  mensagens: Mensagem[];
};

const MAX_CONVERSAS = 50;
const MAX_MENSAGENS = 200;

const agora = () => new Date().toISOString();
const novoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const resumirTitulo = (texto: string) => (texto.length > 42 ? `${texto.slice(0, 42).trim()}…` : texto);

function mensagemDeErro(erro: unknown, padrao: string): string {
  return erro instanceof ApiError || erro instanceof Error ? erro.message : padrao;
}

/** Conversas da SIA no desktop: várias conversas, salvas por veterinário neste navegador. */
export function useSiaConversas(veterinarioId: string | null) {
  const chave = `vetsync:sia:conversas:${veterinarioId ?? 'anon'}`;
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregado, setCarregado] = useState(false);
  /** null = nova conversa (ainda sem mensagens). */
  const [ativaId, setAtivaId] = useState<string | null>(null);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(chave)
      .then(bruto => {
        if (!ativo || !bruto) return;
        try {
          const salvo: unknown = JSON.parse(bruto);
          if (Array.isArray(salvo)) setConversas(salvo as Conversa[]);
        } catch {
          // Dados corrompidos: começa do zero.
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (ativo) setCarregado(true);
      });
    return () => {
      ativo = false;
    };
  }, [chave]);

  useEffect(() => {
    if (!carregado) return;
    AsyncStorage.setItem(chave, JSON.stringify(conversas.slice(0, MAX_CONVERSAS))).catch(() => undefined);
  }, [conversas, carregado, chave]);

  const ordenadas = useMemo(
    () => [...conversas].sort((a, b) => b.atualizadaEm.localeCompare(a.atualizadaEm)),
    [conversas],
  );
  const ativa = useMemo(() => conversas.find(c => c.id === ativaId) ?? null, [conversas, ativaId]);
  /** A conversa aberta está aguardando resposta. */
  const carregando = carregandoId !== null && carregandoId === ativaId;
  /** Há alguma resposta pendente (em qualquer conversa). */
  const ocupado = carregandoId !== null;

  const adicionar = useCallback((cid: string, mensagem: Omit<Mensagem, 'id' | 'hora'>) => {
    setConversas(atuais =>
      atuais.map(c => {
        if (c.id !== cid) return c;
        const hora = agora();
        const id = (c.mensagens[c.mensagens.length - 1]?.id ?? 0) + 1;
        return { ...c, atualizadaEm: hora, mensagens: [...c.mensagens, { ...mensagem, id, hora }].slice(-MAX_MENSAGENS) };
      }),
    );
  }, []);

  const selecionar = useCallback((id: string | null) => setAtivaId(id), []);
  const nova = useCallback(() => setAtivaId(null), []);

  async function enviar(textoBruto: string) {
    const texto = textoBruto.trim();
    if (!texto || carregandoId) return;

    let cid = ativaId;
    const anteriores = ativa?.mensagens ?? [];
    if (!cid) {
      cid = novoId();
      const hora = agora();
      const criada: Conversa = {
        id: cid,
        titulo: resumirTitulo(texto),
        atualizadaEm: hora,
        mensagens: [{ id: 1, autoria: 'usuario', texto, hora }],
      };
      setConversas(atuais => [criada, ...atuais]);
      setAtivaId(cid);
    } else {
      adicionar(cid, { autoria: 'usuario', texto });
    }

    const historico = [...anteriores.filter(m => !m.erro), { autoria: 'usuario' as const, texto }].map(m => ({
      role: m.autoria === 'usuario' ? ('user' as const) : ('assistant' as const),
      text: m.texto,
    }));

    setCarregandoId(cid);
    try {
      const resposta = await iaService.perguntar(texto, null, historico);
      adicionar(cid, { autoria: 'sia', ...resposta });
    } catch (erro) {
      adicionar(cid, { autoria: 'sia', texto: mensagemDeErro(erro, 'Não foi possível obter uma resposta agora.'), erro: true });
    } finally {
      setCarregandoId(null);
    }
  }

  async function selecionarBloco(mensagem: Mensagem, opcao: SiaBlockOption) {
    if (!ativaId || !mensagem.bloco || !opcao.habilitado || carregandoId) return;
    const cid = ativaId;
    adicionar(cid, { autoria: 'usuario', texto: opcao.rotulo });
    setCarregandoId(cid);
    try {
      const resposta = await iaService.selecionarBloco(mensagem.bloco.sessaoId, opcao.id, mensagem.bloco.tipo);
      adicionar(cid, { autoria: 'sia', ...resposta });
    } catch (erro) {
      adicionar(cid, { autoria: 'sia', texto: mensagemDeErro(erro, 'Não foi possível registrar esta escolha.'), erro: true });
    } finally {
      setCarregandoId(null);
    }
  }

  async function confirmarAcao(mensagem: Mensagem) {
    if (!ativaId || !mensagem.acao || carregandoId) return;
    const cid = ativaId;
    setCarregandoId(cid);
    try {
      const resposta = await iaService.confirmarAcao(mensagem.acao.id);
      adicionar(cid, { autoria: 'sia', texto: resposta.texto });
    } catch (erro) {
      adicionar(cid, { autoria: 'sia', texto: mensagemDeErro(erro, 'Não foi possível confirmar a ação.'), erro: true });
    } finally {
      setCarregandoId(null);
    }
  }

  return { conversas: ordenadas, ativa, ativaId, carregando, ocupado, selecionar, nova, enviar, selecionarBloco, confirmarAcao };
}