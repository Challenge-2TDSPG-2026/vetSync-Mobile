import { useEffect, useState } from 'react';
import { imagemEmMemoria, invalidarImagem, obterImagem, ouvirInvalidacoes } from '../services/imagemCache';

type Estado = { url: string; uri: string | null; falhou: boolean };

/**
 * Endereço local de uma foto autenticada. Na primeira vez baixa e salva no aparelho; depois abre direto da cópia
 * (e, se já foi vista nesta sessão, devolve na mesma renderização, sem piscar o ícone de espaço reservado).
 */
export function useImagemCache(url?: string | null, token?: string | null) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [versao, setVersao] = useState(0);
  const emMemoria = imagemEmMemoria(url);

  useEffect(
    () =>
      ouvirInvalidacoes(alvo => {
        if (alvo !== null && alvo !== url) return;
        setEstado(null);
        setVersao(atual => atual + 1);
      }),
    [url]
  );

  useEffect(() => {
    if (!url || !token || imagemEmMemoria(url)) return;
    let ativo = true;
    void obterImagem(url, token).then(uri => {
      if (ativo) setEstado({ url, uri, falhou: uri === null });
    });
    return () => {
      ativo = false;
    };
  }, [url, token, versao]);

  const atual = estado?.url === url ? estado : null;
  const uri = emMemoria ?? atual?.uri ?? null;

  const aoFalhar = () => {
    if (!url) return;
    setEstado({ url, uri: null, falhou: true });
    void invalidarImagem(url, { silencioso: true }); // cópia corrompida: a próxima abertura baixa de novo
  };

  return { uri, falhou: !uri && Boolean(atual?.falhou), aoFalhar };
}
