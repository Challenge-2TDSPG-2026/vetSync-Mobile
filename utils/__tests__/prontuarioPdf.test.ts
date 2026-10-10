import type { Prontuario } from '../../services/prontuarioService';
import { montarHtmlProntuario, nomeArquivoProntuarioPdf } from '../prontuarioPdf';

const base: Prontuario = {
  versao: 1,
  geradoEm: '2026-10-10T10:30:00',
  secoes: ['PERFIL_SAUDE', 'ATENDIMENTOS', 'ORIENTACOES', 'RECEITAS', 'EXAMES'],
  periodoInicio: null,
  periodoFim: null,
  pet: { id: '10', numero: '0010', nome: 'Luna <b>', especie: 'Cão', raca: 'Labrador', sexo: 'F', nascimento: '2020-01-01' },
  perfilSaude: { pesoAtual: 12.5, pesoAtualizadoEm: null, alergias: 'Dipirona', medicamentosContinuos: null, restricoesAlimentares: null, condicoesPreExistentes: null, observacoesImportantes: null },
  atendimentos: [{ id: '1', data: '2026-03-10', hora: '10:00', tipo: 'Consulta', categoria: null, veterinario: 'Dra. Ana', crmv: '123', clinica: null, diagnostico: 'Otite <script>alert(1)</script>', conduta: 'Limpeza', observacaoClinica: null }],
  orientacoes: [{ id: '4', eventoId: '1', dataAtendimento: null, titulo: 'Repouso', texto: 'Evitar escadas\npor 7 dias', autor: 'Dra. Ana', criadaEm: '2026-03-10T15:00:00' }],
  receitas: [{ id: '3', eventoId: '1', medicamento: 'Amoxicilina', principioAtivo: 'Amoxicilina', posologia: '1 comprimido a cada 12h', inicio: '2026-03-11', fim: null, dosesPorDia: 2, status: 'LIBERADO' }],
  exames: [{ id: '2', eventoId: null, nome: 'Hemograma', laboratorio: 'Lab X', coletadoEm: null, resultadoEm: '2026-03-20', resultado: 'Normal', interpretacao: null, veterinario: null, temArquivo: true, arquivoNome: 'a.pdf' }],
  linhaDoTempo: [],
};

describe('montarHtmlProntuario', () => {
  it('inclui todas as seções do prontuário', () => {
    const html = montarHtmlProntuario(base);
    expect(html).toContain('Perfil de saúde');
    expect(html).toContain('Dipirona');
    expect(html).toContain('Atendimentos');
    expect(html).toContain('Orientações');
    expect(html).toContain('Receitas');
    expect(html).toContain('Resultados de exames');
    expect(html).toContain('10/03/2026');
    expect(html).toContain('Laudo em arquivo disponível no VetSync.');
  });

  it('escapa HTML vindo dos dados e preserva quebras de linha', () => {
    const html = montarHtmlProntuario(base);
    expect(html).not.toContain('<script>');
    expect(html).toContain('Otite &lt;script&gt;');
    expect(html).toContain('Luna &lt;b&gt;');
    expect(html).toContain('Evitar escadas<br />por 7 dias');
  });

  it('só renderiza as seções liberadas', () => {
    const html = montarHtmlProntuario({ ...base, secoes: ['EXAMES'] });
    expect(html).toContain('Resultados de exames');
    expect(html).not.toContain('Perfil de saúde');
    expect(html).not.toContain('Amoxicilina');
    expect(html).not.toContain('Otite');
  });

  it('mostra mensagem amigável nas seções vazias', () => {
    const html = montarHtmlProntuario({ ...base, perfilSaude: null, atendimentos: [], orientacoes: [], receitas: [], exames: [] });
    expect(html).toContain('Nenhuma informação registrada.');
    expect(html).toContain('Nenhum atendimento concluído no período.');
    expect(html).toContain('Nenhum exame no período.');
  });

  it('informa o período quando houver filtro', () => {
    const html = montarHtmlProntuario({ ...base, periodoInicio: '2026-01-01', periodoFim: null });
    expect(html).toContain('Período: 01/01/2026 a hoje');
  });

  it('não vaza dados pessoais do tutor nem custos', () => {
    const html = montarHtmlProntuario(base).toLowerCase();
    expect(html).not.toContain('telefone');
    expect(html).not.toContain('e-mail');
    expect(html).not.toContain('r$');
  });
});

describe('nomeArquivoProntuarioPdf', () => {
  it('gera nome com o pet e a data', () => {
    expect(nomeArquivoProntuarioPdf('Thor Ávila', new Date(2026, 9, 10))).toBe('prontuario-thor-avila-20261010.pdf');
  });
});
