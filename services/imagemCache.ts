import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '../constants';

/**
 * Cache local das fotos autenticadas (pets e produtos do catálogo).
 *
 * - Celular: o arquivo é salvo na pasta privada do app (expo-file-system) e a tela passa a usar o arquivo local,
 *   sem baixar de novo nem mandar o token a cada exibição.
 * - Web: o navegador não tem pasta de arquivos; usamos o Cache Storage (o "localStorage" para arquivos,
 *   que aguenta imagens, ao contrário do localStorage comum, limitado a ~5 MB e só texto).
 *
 * A foto continua no banco/API como fonte oficial: aqui é só uma cópia para abrir rápido (e também sem internet).
 */

/** Depois disso a cópia é baixada de novo; se estiver offline, a cópia antiga continua sendo usada. */
export const IMAGENS_VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

const TEMPO_LIMITE_MS = 15_000;
const NOME_PASTA = 'imagens-cache';
const NOME_CACHE_WEB = 'vetsync-imagens-v1';
const CABECALHO_SALVO_EM = 'x-salvo-em';

const EXTENSOES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

type Entrada = { t: number; ext: string };

const memoria = new Map<string, string>();
const emAndamento = new Map<string, Promise<string | null>>();
const ouvintes = new Set<(url: string | null) => void>();
let indice: Record<string, Entrada> | null = null;

const ehWeb = Platform.OS === 'web';

function chaveDe(url: string): string {
  // cyrb53: hash curto e estável para usar como nome de arquivo.
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < url.length; i += 1) {
    const c = url.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function extensaoDe(tipo: string | null | undefined): string {
  const limpo = (tipo ?? '').split(';')[0].trim().toLowerCase();
  return EXTENSOES[limpo] ?? 'jpg';
}

function pasta(): Directory {
  return new Directory(Paths.document, NOME_PASTA);
}

async function carregarIndice(): Promise<Record<string, Entrada>> {
  if (indice) return indice;
  try {
    const bruto = await AsyncStorage.getItem(STORAGE_KEYS.CACHE_IMAGENS);
    indice = bruto ? (JSON.parse(bruto) as Record<string, Entrada>) : {};
  } catch {
    indice = {};
  }
  return indice;
}

function salvarIndice(): void {
  AsyncStorage.setItem(STORAGE_KEYS.CACHE_IMAGENS, JSON.stringify(indice ?? {})).catch(() => undefined);
}

function avisar(url: string | null): void {
  ouvintes.forEach(ouvinte => ouvinte(url));
}

function liberarUri(uri: string | undefined): void {
  if (ehWeb && uri?.startsWith('blob:')) URL.revokeObjectURL(uri);
}

async function baixar(url: string, token: string): Promise<Response | null> {
  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: controlador.signal });
    return resposta.ok ? resposta : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function gravarNativo(url: string, bytes: Uint8Array, ext: string): Promise<string> {
  const mapa = await carregarIndice();
  const chave = chaveDe(url);
  const entrada = mapa[chave];
  pasta().create({ idempotent: true, intermediates: true });
  const arquivo = new File(pasta(), `${chave}.${ext}`);
  if (!arquivo.exists) arquivo.create();
  arquivo.write(bytes);
  if (entrada && entrada.ext !== ext) {
    const antigo = new File(pasta(), `${chave}.${entrada.ext}`);
    if (antigo.exists) antigo.delete();
  }
  mapa[chave] = { t: Date.now(), ext };
  salvarIndice();
  return arquivo.uri;
}

async function obterNativo(url: string, token: string): Promise<string | null> {
  const mapa = await carregarIndice();
  const chave = chaveDe(url);
  const entrada = mapa[chave];
  const arquivoAtual = entrada ? new File(pasta(), `${chave}.${entrada.ext}`) : null;
  const temCopia = Boolean(arquivoAtual?.exists);

  if (entrada && arquivoAtual && temCopia && Date.now() - entrada.t < IMAGENS_VALIDADE_MS) return arquivoAtual.uri;

  const resposta = await baixar(url, token);
  if (!resposta) return temCopia && arquivoAtual ? arquivoAtual.uri : null; // offline: usa a cópia antiga

  try {
    const bytes = new Uint8Array(await resposta.arrayBuffer());
    return await gravarNativo(url, bytes, extensaoDe(resposta.headers.get('content-type')));
  } catch {
    return temCopia && arquivoAtual ? arquivoAtual.uri : null;
  }
}

async function abrirCacheWeb(): Promise<Cache | null> {
  try {
    return typeof caches === 'undefined' ? null : await caches.open(NOME_CACHE_WEB);
  } catch {
    return null;
  }
}

async function obterWeb(url: string, token: string): Promise<string | null> {
  const cache = await abrirCacheWeb();
  const salvo = cache ? await cache.match(url) : undefined;
  const salvoEm = Number(salvo?.headers.get(CABECALHO_SALVO_EM) ?? 0);

  if (salvo && Date.now() - salvoEm < IMAGENS_VALIDADE_MS) return URL.createObjectURL(await salvo.blob());

  const resposta = await baixar(url, token);
  if (!resposta) return salvo ? URL.createObjectURL(await salvo.blob()) : null; // offline: usa a cópia antiga

  const blob = await resposta.blob();
  if (cache) {
    const cabecalhos = { 'Content-Type': blob.type, [CABECALHO_SALVO_EM]: String(Date.now()) };
    await cache.put(url, new Response(blob, { headers: cabecalhos })).catch(() => undefined);
  }
  return URL.createObjectURL(blob);
}

/** Endereço da cópia local se ela já foi carregada nesta sessão (permite mostrar a foto sem nenhum atraso). */
export function imagemEmMemoria(url?: string | null): string | null {
  return url ? memoria.get(url) ?? null : null;
}

/** Devolve o endereço local da imagem: usa a cópia salva ou baixa uma vez e guarda. null se não foi possível. */
export function obterImagem(url: string, token: string): Promise<string | null> {
  const emMemoria = memoria.get(url);
  if (emMemoria) return Promise.resolve(emMemoria);

  const pendente = emAndamento.get(url);
  if (pendente) return pendente;

  const tarefa = (ehWeb ? obterWeb(url, token) : obterNativo(url, token))
    .catch(() => null)
    .then(uri => {
      if (uri) memoria.set(url, uri);
      return uri;
    })
    .finally(() => emAndamento.delete(url));
  emAndamento.set(url, tarefa);
  return tarefa;
}

/**
 * Usa uma imagem que já está no aparelho (a foto recém-recortada) como a foto da URL, na hora e sem baixar nada.
 * Assim a troca de foto aparece instantaneamente, em vez de esperar o envio e depois baixar a foto de novo.
 */
export async function definirImagemLocal(url: string, uriLocal: string): Promise<void> {
  if (!url) return;
  liberarUri(memoria.get(url));
  memoria.set(url, uriLocal);
  emAndamento.delete(url);
  avisar(url);

  try {
    const resposta = await fetch(uriLocal);
    if (ehWeb) {
      const blob = await resposta.blob();
      const cache = await abrirCacheWeb();
      const cabecalhos = { 'Content-Type': blob.type, [CABECALHO_SALVO_EM]: String(Date.now()) };
      await cache?.put(url, new Response(blob, { headers: cabecalhos }));
    } else {
      const bytes = new Uint8Array(await resposta.arrayBuffer());
      const salvo = await gravarNativo(url, bytes, extensaoDe(resposta.headers.get('content-type') ?? 'image/jpeg'));
      if (memoria.get(url) === uriLocal) memoria.set(url, salvo); // troca o arquivo temporário pela cópia salva
    }
  } catch {
    // Sem a cópia salva a foto continua aparecendo nesta sessão e é baixada de novo na próxima.
  }
}

/** Descarta a cópia de uma foto (ao trocar ou remover) e avisa as telas abertas para buscarem a nova. */
export async function invalidarImagem(url?: string | null, opcoes: { silencioso?: boolean } = {}): Promise<void> {
  if (!url) return;
  liberarUri(memoria.get(url));
  memoria.delete(url);
  emAndamento.delete(url);

  try {
    if (ehWeb) {
      const cache = await abrirCacheWeb();
      await cache?.delete(url);
    } else {
      const mapa = await carregarIndice();
      const chave = chaveDe(url);
      const entrada = mapa[chave];
      if (entrada) {
        delete mapa[chave];
        salvarIndice();
        const arquivo = new File(pasta(), `${chave}.${entrada.ext}`);
        if (arquivo.exists) arquivo.delete();
      }
    }
  } catch {
    // Sem a cópia local a tela apenas baixa a foto de novo.
  }
  if (!opcoes.silencioso) avisar(url);
}

/** Apaga todas as fotos salvas. Chamado ao sair da conta para não deixar fotos de pets no aparelho. */
export async function limparCacheImagens(): Promise<void> {
  memoria.forEach(liberarUri);
  memoria.clear();
  emAndamento.clear();
  indice = {};
  try {
    if (ehWeb) {
      if (typeof caches !== 'undefined') await caches.delete(NOME_CACHE_WEB);
    } else {
      const diretorio = pasta();
      if (diretorio.exists) diretorio.delete();
    }
  } catch {
    // Melhor esforço: a próxima sessão sobrescreve o que restar.
  }
  await AsyncStorage.removeItem(STORAGE_KEYS.CACHE_IMAGENS).catch(() => undefined);
  avisar(null);
}

/** Permite que os componentes reajam quando uma foto é trocada/removida (url) ou quando tudo é limpo (null). */
export function ouvirInvalidacoes(ouvinte: (url: string | null) => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}
