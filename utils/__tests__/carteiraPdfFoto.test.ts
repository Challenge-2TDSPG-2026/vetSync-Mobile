import { carregarFotoPetPdf } from '../carteiraPdfFoto';

const originalFetch = globalThis.fetch;
const originalFileReader = globalThis.FileReader;
afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.FileReader = originalFileReader;
});

/** Leitor mínimo, para o teste não depender do ambiente (node não tem FileReader). */
class LeitorFake {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL(blob: Blob) {
    void blob.arrayBuffer().then(buffer => {
      this.result = `data:${blob.type};base64,${btoa(String.fromCharCode(...new Uint8Array(buffer)))}`;
      this.onload?.();
    });
  }
}

describe('carregarFotoPetPdf', () => {
  it('não busca nada sem url ou sem token', async () => {
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
    expect(await carregarFotoPetPdf(null, 'tk')).toBeNull();
    expect(await carregarFotoPetPdf('https://api/x.jpg', null)).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('envia o token e devolve data URI', async () => {
    globalThis.FileReader = LeitorFake as unknown as typeof FileReader;
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async () => blob, headers: new Headers({ 'content-type': 'image/png' }) }) as unknown as typeof fetch;
    const uri = await carregarFotoPetPdf('https://api/pets/1/foto', 'tk');
    expect(uri).toBe('data:image/png;base64,AQID');
    expect((globalThis.fetch as jest.Mock).mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer tk' });
  });

  it('devolve null quando a resposta falha ou a rede cai', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    expect(await carregarFotoPetPdf('https://api/x', 'tk')).toBeNull();
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('rede')) as unknown as typeof fetch;
    expect(await carregarFotoPetPdf('https://api/x', 'tk')).toBeNull();
  });
});