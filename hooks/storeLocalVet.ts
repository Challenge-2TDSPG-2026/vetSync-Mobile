import { useCallback, useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

/**
 * Cria um hook que guarda UM valor por veterinário no aparelho (AsyncStorage) e o compartilha em memória
 * entre todas as telas, para que home, conta e atendimento enxerguem sempre o mesmo estado.
 */
export function criarStoreLocalVet<T>(prefixo: string, validar: (valor: unknown) => valor is T) {
  type Estado = { vetId: string | null; valor: T | null; carregado: boolean };
  let estado: Estado = { vetId: null, valor: null, carregado: false };
  const ouvintes = new Set<() => void>();
  let adiado: ReturnType<typeof setTimeout> | null = null;

  const chave = (vetId: string) => `${prefixo}${vetId}`;
  const obter = () => estado;
  const assinar = (ouvinte: () => void) => {
    ouvintes.add(ouvinte);
    return () => {
      ouvintes.delete(ouvinte);
    };
  };
  const definirEstado = (parcial: Partial<Estado>) => {
    estado = { ...estado, ...parcial };
    ouvintes.forEach(ouvinte => ouvinte());
  };

  async function gravar(vetId: string, valor: T | null) {
    try {
      if (valor === null) await AsyncStorage.removeItem(chave(vetId));
      else await AsyncStorage.setItem(chave(vetId), JSON.stringify(valor));
    } catch {
      // armazenamento local indisponível: o valor segue apenas em memória nesta sessão
    }
  }

  async function carregar(vetId: string) {
    if (estado.vetId === vetId) return;
    definirEstado({ vetId, valor: null, carregado: false });
    let valor: T | null = null;
    try {
      const bruto = await AsyncStorage.getItem(chave(vetId));
      if (bruto) {
        const dado: unknown = JSON.parse(bruto);
        if (validar(dado)) valor = dado;
      }
    } catch {
      // dado corrompido ou indisponível: começa vazio
    }
    if (estado.vetId === vetId) definirEstado({ valor, carregado: true });
  }

  function useStoreLocalVet() {
    const { sessao } = useAuth();
    const vetId = sessao?.perfil === 'VETERINARIO' ? String(sessao.idUsuario) : null;
    const snapshot = useSyncExternalStore(assinar, obter, obter);

    useEffect(() => {
      if (vetId) void carregar(vetId);
      else if (estado.vetId) definirEstado({ vetId: null, valor: null, carregado: false });
    }, [vetId]);

    const definir = useCallback(
      (valor: T | null, opcoes?: { adiar?: boolean }): Promise<void> => {
        if (!vetId) return Promise.resolve();
        definirEstado({ vetId, valor });
        if (adiado) clearTimeout(adiado);
        if (opcoes?.adiar) {
          adiado = setTimeout(() => void gravar(vetId, estado.valor), 300);
          return Promise.resolve();
        }
        return gravar(vetId, valor);
      },
      [vetId],
    );

    const ativo = vetId !== null && snapshot.vetId === vetId;
    return { valor: ativo ? snapshot.valor : null, carregado: ativo && snapshot.carregado, definir };
  }

  return useStoreLocalVet;
}
