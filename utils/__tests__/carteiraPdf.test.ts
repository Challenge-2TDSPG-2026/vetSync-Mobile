import type { Pet } from '../../types';
import type { CarteiraVacinacao } from '../../services/petHealthService';
import { escaparHtml, formatarDataPdf, montarHtmlCarteiraPdf, nomeArquivoCarteiraPdf } from '../carteiraPdf';

const pet: Pet = {
  id: '1',
  nome: 'Luna <b>',
  especie: 'gato',
  sexo: 'femea',
  raca: 'Siamês',
  dataNascimento: '2020-03-15',
  peso: '4.2',
  numero: 'PET-001',
  tutor: { id: 't1', nome: 'Arthur', telefone: '(11) 99999-0000' },
};

const carteira: CarteiraVacinacao = {
  petId: '1',
  vacinas: [
    { id: 'v2', nome: 'Antirrábica', aplicadaEm: '2025-06-10', proximaDoseEm: '2026-06-10', status: 'ATRASADA', veterinario: 'Dra. Ana' },
    { id: 'v1', nome: 'V4 <script>', aplicadaEm: '2024-01-05', proximaDoseEm: null, status: 'EM_DIA', veterinario: null },
  ],
  resumo: { emDia: 1, vencendo: 0, atrasadas: 1, futuras: 0 },
};

jest.mock('../../constants', () => ({
  ESPECIES: [
    { valor: 'cachorro', label: 'Cão' },
    { valor: 'gato', label: 'Gato' },
  ],
}));

describe('carteiraPdf', () => {
  it('escapa HTML vindo de dados do usuário/API', () => {
    expect(escaparHtml('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
    const html = montarHtmlCarteiraPdf({ pet, carteira });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('Luna <b>');
    expect(html).toContain('Luna &lt;b&gt;');
    expect(html).toContain('V4 &lt;script&gt;');
  });

  it('monta carteirinha na 1ª página e vacinas na 2ª', () => {
    const html = montarHtmlCarteiraPdf({ pet, carteira });
    const paginas = html.split('<section class="pagina">');
    expect(paginas).toHaveLength(3);
    expect(paginas[1]).toContain('Carteirinha do pet');
    expect(paginas[1]).toContain('Gato');
    expect(paginas[1]).toContain('4.2 kg');
    expect(paginas[1]).toContain('PET-001');
    expect(paginas[2]).toContain('Carteira de vacinação');
    expect(paginas[2]).toContain('Antirrábica');
    expect(paginas[2]).toContain('Atrasada');
    expect(paginas[2]).toContain('Em dia');
  });

  it('ordena vacinas da mais antiga para a mais recente', () => {
    const html = montarHtmlCarteiraPdf({ pet, carteira });
    expect(html.indexOf('V4 &lt;script&gt;')).toBeLessThan(html.indexOf('Antirrábica'));
  });

  it('mostra mensagem quando não há vacinas', () => {
    const html = montarHtmlCarteiraPdf({ pet, carteira: { petId: '1', vacinas: [], resumo: { emDia: 0, vencendo: 0, atrasadas: 0, futuras: 0 } } });
    expect(html).toContain('Nenhuma vacina registrada');
  });

  it('formata datas em pt-BR e usa traço quando ausente/ inválida', () => {
    expect(formatarDataPdf('2025-06-10')).toMatch(/^10\/06\/2025$/);
    expect(formatarDataPdf(null)).toBe('—');
    expect(formatarDataPdf('lixo')).toBe('—');
  });

  it('embute os logos VetSync e ignora valores que não sejam PNG em base64', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    const html = montarHtmlCarteiraPdf({ pet, carteira, logos: { branco: png, cor: png } });
    expect(html).toContain('cartao-marca-dagua');
    expect(html).toContain('cabecalho-logo');
    expect(html).toContain('Cuidado contínuo para o seu pet');
    expect(html).toContain('CLYVO VET');

    const malicioso = montarHtmlCarteiraPdf({ pet, carteira, logos: { branco: '"><script>x</script>', cor: 'javascript:alert(1)' } });
    expect(malicioso).not.toContain('<script>x');
    expect(malicioso).not.toContain('javascript:');
    expect(malicioso).not.toContain('<img');
  });

  it('usa a foto do pet quando informada e cai na inicial quando ausente ou inválida', () => {
    const foto = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const comFoto = montarHtmlCarteiraPdf({ pet, carteira, fotoDataUri: foto });
    expect(comFoto).toContain('class="avatar-foto"');
    expect(comFoto).not.toContain('<div class="avatar">');

    const semFoto = montarHtmlCarteiraPdf({ pet, carteira });
    expect(semFoto).not.toContain('class="avatar-foto"');
    expect(semFoto).toContain('<div class="avatar">L</div>');

    const invalida = montarHtmlCarteiraPdf({ pet, carteira, fotoDataUri: 'https://x.com/a.jpg" onerror="x' });
    expect(invalida).not.toContain('avatar-foto"');
    expect(invalida).not.toContain('onerror');
  });

  it('gera nome de arquivo seguro', () => {
    expect(nomeArquivoCarteiraPdf({ nome: 'Luna da Silva' })).toBe('carteira-luna-da-silva.pdf');
    expect(nomeArquivoCarteiraPdf({ nome: 'Thór/Ção' })).toBe('carteira-thor-cao.pdf');
    expect(nomeArquivoCarteiraPdf({ nome: '???' })).toBe('carteira-pet.pdf');
  });
});