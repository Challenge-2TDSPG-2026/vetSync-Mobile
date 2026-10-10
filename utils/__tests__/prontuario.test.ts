import type { Prontuario } from '../../services/prontuarioService';
import {
  alternarSecao,
  chaveFiltros,
  contarPorTipo,
  dataBrParaIso,
  formatarDataHoraProntuario,
  formatarDataProntuario,
  inicioDoPeriodo,
  mascaraDataBr,
  montarItensProntuario,
  montarQueryProntuario,
  nomeSeguroArquivo,
  resumoSecoes,
  situacaoCompartilhamento,
  slugDoPet,
  TODAS_AS_SECOES,
  validarArquivoLaudo,
} from '../prontuario';

const prontuario: Prontuario = {
  versao: 1,
  geradoEm: '2026-10-10T10:00:00',
  secoes: TODAS_AS_SECOES,
  periodoInicio: null,
  periodoFim: null,
  pet: { id: '10', numero: '0010', nome: 'Luna', especie: 'Cão', raca: 'Labrador', sexo: 'F', nascimento: '2020-01-01' },
  perfilSaude: null,
  atendimentos: [
    { id: '1', data: '2026-03-10', hora: '10:00', tipo: 'Consulta', categoria: null, veterinario: 'Dra. Ana', crmv: '123', clinica: null, diagnostico: 'Otite', conduta: null, observacaoClinica: null },
  ],
  orientacoes: [{ id: '4', eventoId: '1', dataAtendimento: '2026-03-10', titulo: 'Repouso', texto: '7 dias', autor: 'Dra. Ana', criadaEm: '2026-03-10T15:00:00' }],
  receitas: [{ id: '3', eventoId: '1', medicamento: 'Amoxicilina', principioAtivo: null, posologia: '12/12h', inicio: '2026-03-11', fim: null, dosesPorDia: 2, status: 'LIBERADO' }],
  exames: [{ id: '2', eventoId: null, nome: 'Hemograma', laboratorio: null, coletadoEm: null, resultadoEm: '2026-03-20', resultado: 'Normal', interpretacao: null, veterinario: null, temArquivo: true, arquivoNome: 'a.pdf' }],
  linhaDoTempo: [
    { tipo: 'EXAME', id: '2', data: '2026-03-20', titulo: 'Hemograma', eventoId: null },
    { tipo: 'RECEITA', id: '3', data: '2026-03-11', titulo: 'Amoxicilina', eventoId: '1' },
    { tipo: 'ATENDIMENTO', id: '1', data: '2026-03-10', titulo: 'Consulta', eventoId: '1' },
    { tipo: 'ORIENTACAO', id: '4', data: '2026-03-10', titulo: 'Repouso', eventoId: '1' },
    { tipo: 'EXAME', id: '99', data: '2026-01-01', titulo: 'Sem detalhe', eventoId: null },
  ],
};

describe('montarQueryProntuario', () => {
  it('não gera query sem filtros', () => {
    expect(montarQueryProntuario()).toBe('');
  });

  it('inclui formato, seções e período', () => {
    expect(montarQueryProntuario({ secoes: ['EXAMES', 'RECEITAS'], de: '2026-01-01', ate: '2026-06-30' }, 'JSON'))
      .toBe('?formato=JSON&secoes=EXAMES,RECEITAS&de=2026-01-01&ate=2026-06-30');
  });

  it('gera a mesma chave de cache independente da ordem das seções', () => {
    expect(chaveFiltros({ secoes: ['EXAMES', 'RECEITAS'] })).toBe(chaveFiltros({ secoes: ['RECEITAS', 'EXAMES'] }));
  });
});

describe('datas', () => {
  it('formata datas ISO e datetime', () => {
    expect(formatarDataProntuario('2026-03-10')).toBe('10/03/2026');
    expect(formatarDataProntuario('2026-03-10T15:00:00')).toBe('10/03/2026');
    expect(formatarDataProntuario(null)).toBe('Não informado');
    expect(formatarDataProntuario('lixo', '-')).toBe('-');
  });

  it('formata data e hora', () => {
    expect(formatarDataHoraProntuario('2026-03-10T15:05:00')).toBe('10/03/2026 15:05');
    expect(formatarDataHoraProntuario('invalida')).toBe('Não informado');
  });

  it('aplica a máscara DD/MM/AAAA', () => {
    expect(mascaraDataBr('1')).toBe('1');
    expect(mascaraDataBr('1003')).toBe('10/03');
    expect(mascaraDataBr('10032026')).toBe('10/03/2026');
    expect(mascaraDataBr('10/03/2026abc99')).toBe('10/03/2026');
  });

  it('converte DD/MM/AAAA para ISO e rejeita datas inexistentes', () => {
    expect(dataBrParaIso('10/03/2026')).toBe('2026-03-10');
    expect(dataBrParaIso('31/02/2026')).toBeNull();
    expect(dataBrParaIso('10/03/26')).toBeNull();
    expect(dataBrParaIso('')).toBeNull();
  });

  it('calcula o início do período de compartilhamento', () => {
    const hoje = new Date(2026, 9, 10);
    expect(inicioDoPeriodo('TUDO', hoje)).toBeUndefined();
    expect(inicioDoPeriodo('6M', hoje)).toBe('2026-04-10');
    expect(inicioDoPeriodo('12M', hoje)).toBe('2025-10-10');
  });

  it('ajusta para o fim do mês quando o dia não existe', () => {
    expect(inicioDoPeriodo('6M', new Date(2026, 7, 31))).toBe('2026-02-28');
  });
});

describe('linha do tempo', () => {
  it('mantém a ordem e descarta entradas sem detalhe', () => {
    const itens = montarItensProntuario(prontuario);
    expect(itens.map(item => item.tipo)).toEqual(['EXAME', 'RECEITA', 'ATENDIMENTO', 'ORIENTACAO']);
  });

  it('filtra por tipo', () => {
    expect(montarItensProntuario(prontuario, 'EXAME').map(item => item.id)).toEqual(['2']);
    expect(montarItensProntuario(prontuario, 'ORIENTACAO')).toHaveLength(1);
  });

  it('conta os itens por tipo', () => {
    expect(contarPorTipo(prontuario)).toEqual({ TUDO: 4, ATENDIMENTO: 1, ORIENTACAO: 1, RECEITA: 1, EXAME: 1 });
  });
});

describe('compartilhamento', () => {
  it('alterna seções sem alterar a lista original', () => {
    const original = ['EXAMES'] as const;
    expect(alternarSecao([...original], 'RECEITAS')).toEqual(['EXAMES', 'RECEITAS']);
    expect(alternarSecao(['EXAMES', 'RECEITAS'], 'EXAMES')).toEqual(['RECEITAS']);
    expect(original).toEqual(['EXAMES']);
  });

  it('resume as seções liberadas', () => {
    expect(resumoSecoes(TODAS_AS_SECOES)).toBe('Prontuário completo');
    expect(resumoSecoes(['EXAMES', 'ORIENTACOES'])).toBe('Exames, Orientações');
  });

  it('classifica a situação do link', () => {
    expect(situacaoCompartilhamento({ ativo: true, revogadaEm: null })).toBe('ATIVO');
    expect(situacaoCompartilhamento({ ativo: false, revogadaEm: null })).toBe('EXPIRADO');
    expect(situacaoCompartilhamento({ ativo: false, revogadaEm: '2026-10-01T00:00:00' })).toBe('REVOGADO');
  });
});

describe('laudos e nomes de arquivo', () => {
  it('aceita só os tipos e o tamanho permitidos', () => {
    expect(validarArquivoLaudo({ tipoMime: 'application/pdf', tamanho: 1000 })).toBeNull();
    expect(validarArquivoLaudo({ tipoMime: 'IMAGE/PNG', tamanho: 1000 })).toBeNull();
    expect(validarArquivoLaudo({ tipoMime: 'image/svg+xml', tamanho: 10 })).toMatch(/PDF, JPEG, PNG ou WebP/);
    expect(validarArquivoLaudo({ tipoMime: null })).toMatch(/PDF, JPEG, PNG ou WebP/);
    expect(validarArquivoLaudo({ tipoMime: 'application/pdf', tamanho: 11 * 1024 * 1024 })).toMatch(/10 MB/);
  });

  it('limpa o nome do arquivo', () => {
    expect(nomeSeguroArquivo('C:\\temp\\laudo.pdf')).toBe('laudo.pdf');
    expect(nomeSeguroArquivo('../../x/"laudo".pdf')).toBe('laudo.pdf');
    expect(nomeSeguroArquivo('   ', 'exame')).toBe('exame');
    expect(nomeSeguroArquivo(null)).toBe('arquivo');
  });

  it('gera slug do pet', () => {
    expect(slugDoPet('Thor Ávila')).toBe('thor-avila');
    expect(slugDoPet('!!!')).toBe('pet');
  });
});
