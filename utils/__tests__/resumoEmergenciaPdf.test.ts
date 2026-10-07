import type { PerfilSaudePet, Pet } from '../../types';
import { montarHtmlResumoEmergencia, nomeArquivoResumoEmergenciaPdf } from '../resumoEmergenciaPdf';

jest.mock('../../constants', () => ({
  ESPECIES: [{ valor: 'gato', label: 'Gato' }],
}));

const pet: Pet = {
  id: '12', numero: '0012', nome: 'Luna <b>', especie: 'gato', sexo: 'femea',
  raca: 'Siamês', dataNascimento: '2020-03-15', peso: '4.2',
  tutor: { id: '7', nome: 'Ana', telefone: '(11) 99999-0000', email: 'ana@example.com' },
};
const perfil: PerfilSaudePet = {
  pesoAtual: 4.2, pesoAtualizadoEm: '2026-10-07', alergias: '<script>alert(1)</script>',
  medicamentosContinuos: null, restricoesAlimentares: null, condicoesPreExistentes: 'Cardiopatia',
  observacoesImportantes: null, contatoEmergencia: 'Carlos · (11) 98888-0000',
  veterinarioPreferencialId: null,
};

describe('resumoEmergenciaPdf', () => {
  it('identifica a origem das seções e inclui os contatos distintos', () => {
    const html = montarHtmlResumoEmergencia({ pet, perfil, geradoEm: new Date('2026-10-07T12:00:00Z') });

    expect(html).toContain('Origem: cadastro do pet');
    expect(html).toContain('Origem: cadastro do tutor e perfil de saúde do pet');
    expect(html).toContain('Ana');
    expect(html).toContain('Carlos · (11) 98888-0000');
  });

  it('mostra Não informado para campos vazios e escapa conteúdo da API', () => {
    const html = montarHtmlResumoEmergencia({ pet, perfil });

    expect(html).toContain('Não informado');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('Luna &lt;b&gt;');
  });

  it('gera um nome seguro para o arquivo', () => {
    expect(nomeArquivoResumoEmergenciaPdf({ nome: 'Thór/Ção' })).toBe('emergencia-thor-cao.pdf');
  });
});
