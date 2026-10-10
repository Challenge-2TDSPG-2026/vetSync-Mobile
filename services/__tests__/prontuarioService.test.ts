import { api } from '../api/httpClient';
import { prontuarioService } from '../prontuarioService';

jest.mock('../api/httpClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn(), uploadMultipart: jest.fn() },
}));

const dtoExame = {
  id: 7, eventoId: 100, nome: 'Hemograma', laboratorio: 'Lab X', coletadoEm: '2026-03-18', resultadoEm: '2026-03-20',
  resultado: 'Normal', interpretacao: null, veterinario: 'Dra. Ana', temArquivo: true, arquivoNome: 'a.pdf',
};

const dtoProntuario = {
  versao: 1, geradoEm: '2026-10-10T10:00:00', secoes: ['EXAMES'], periodoInicio: null, periodoFim: null,
  pet: { id: 10, numero: '0010', nome: 'Luna', especie: 'Cão', raca: null, sexo: 'F', nascimento: null },
  perfilSaude: null,
  atendimentos: [{ id: 1, data: '2026-03-10', hora: null, tipo: 'Consulta', categoria: null, veterinario: null, crmv: null, clinica: null, diagnostico: null, conduta: null, observacaoClinica: null }],
  orientacoes: [{ id: 4, eventoId: 1, dataAtendimento: null, titulo: 'Repouso', texto: 't', autor: null, criadaEm: '2026-03-10T15:00:00' }],
  receitas: [{ id: 3, eventoId: 1, medicamento: 'Amoxicilina', principioAtivo: null, posologia: 'x', inicio: '2026-03-11', fim: null, dosesPorDia: null, status: 'LIBERADO' }],
  exames: [dtoExame],
  linhaDoTempo: [{ tipo: 'EXAME', id: 7, data: '2026-03-20', titulo: 'Hemograma', eventoId: null }],
};

describe('prontuarioService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('consulta o prontuário com filtros e converte os ids para texto', async () => {
    (api.get as jest.Mock).mockResolvedValue(dtoProntuario);

    const resultado = await prontuarioService.consultar('10', { secoes: ['EXAMES'], de: '2026-01-01' });

    expect(api.get).toHaveBeenCalledWith('/pets/10/prontuario?secoes=EXAMES&de=2026-01-01');
    expect(resultado.pet.id).toBe('10');
    expect(resultado.atendimentos[0].id).toBe('1');
    expect(resultado.orientacoes[0]).toMatchObject({ id: '4', eventoId: '1' });
    expect(resultado.receitas[0]).toMatchObject({ id: '3', eventoId: '1' });
    expect(resultado.exames[0]).toMatchObject({ id: '7', eventoId: '100' });
    expect(resultado.linhaDoTempo[0]).toMatchObject({ id: '7', eventoId: null });
  });

  it('exporta pelo endpoint de exportação em JSON (só receitas liberadas)', async () => {
    (api.get as jest.Mock).mockResolvedValue(dtoProntuario);

    await prontuarioService.exportar('10');

    expect(api.get).toHaveBeenCalledWith('/pets/10/prontuario/exportar?formato=JSON');
  });

  it('cria, lista e remove orientações de um atendimento', async () => {
    (api.post as jest.Mock).mockResolvedValue(dtoProntuario.orientacoes[0]);
    (api.get as jest.Mock).mockResolvedValue(dtoProntuario.orientacoes);
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    const criada = await prontuarioService.criarOrientacao('1', { titulo: 'Repouso', texto: 't' });
    const lista = await prontuarioService.listarOrientacoes('1');
    await prontuarioService.removerOrientacao('1', '4');

    expect(api.post).toHaveBeenCalledWith('/eventos/1/orientacoes', { titulo: 'Repouso', texto: 't' });
    expect(api.get).toHaveBeenCalledWith('/eventos/1/orientacoes');
    expect(api.delete).toHaveBeenCalledWith('/eventos/1/orientacoes/4');
    expect(criada.eventoId).toBe('1');
    expect(lista[0].id).toBe('4');
  });

  it('registra o exame enviando o atendimento como número', async () => {
    (api.post as jest.Mock).mockResolvedValue(dtoExame);

    const exame = await prontuarioService.registrarExame('10', { idEvento: '100', nome: 'Hemograma', resultadoEm: '2026-03-20' });

    expect(api.post).toHaveBeenCalledWith('/pets/10/exames', { idEvento: 100, nome: 'Hemograma', resultadoEm: '2026-03-20' });
    expect(exame.id).toBe('7');
  });

  it('registra o exame sem atendimento quando não informado', async () => {
    (api.post as jest.Mock).mockResolvedValue({ ...dtoExame, eventoId: null });

    await prontuarioService.registrarExame('10', { nome: 'Raio-X', resultadoEm: '2026-03-20' });

    expect((api.post as jest.Mock).mock.calls[0][1].idEvento).toBeUndefined();
  });

  it('envia o laudo no campo "arquivo" por POST', async () => {
    (api.uploadMultipart as jest.Mock).mockResolvedValue(dtoExame);
    const arquivo = { uri: 'file:///laudo.pdf', nome: 'laudo.pdf', tipoMime: 'application/pdf' };

    await prontuarioService.anexarArquivoExame('10', '7', arquivo);

    expect(api.uploadMultipart).toHaveBeenCalledWith('/pets/10/exames/7/arquivo', arquivo, true, {
      campo: 'arquivo', metodo: 'POST', descricao: 'laudo',
    });
  });

  it('salva o exame e envia o laudo na sequência', async () => {
    (api.post as jest.Mock).mockResolvedValue(dtoExame);
    (api.uploadMultipart as jest.Mock).mockResolvedValue(dtoExame);
    const arquivo = { uri: 'file:///laudo.pdf', nome: 'laudo.pdf', tipoMime: 'application/pdf' };

    const resultado = await prontuarioService.registrarExameComLaudo('10', { nome: 'Hemograma', resultadoEm: '2026-03-20' }, arquivo);

    expect(resultado).toEqual({ exameId: '7', erroArquivo: null });
    expect(api.uploadMultipart).toHaveBeenCalledWith('/pets/10/exames/7/arquivo', arquivo, true, expect.any(Object));
  });

  it('não tenta enviar laudo quando não há arquivo', async () => {
    (api.post as jest.Mock).mockResolvedValue(dtoExame);

    const resultado = await prontuarioService.registrarExameComLaudo('10', { nome: 'Hemograma', resultadoEm: '2026-03-20' });

    expect(resultado).toEqual({ exameId: '7', erroArquivo: null });
    expect(api.uploadMultipart).not.toHaveBeenCalled();
  });

  it('mantém o exame salvo e devolve o erro quando só o laudo falha', async () => {
    (api.post as jest.Mock).mockResolvedValue(dtoExame);
    const falha = new Error('Sem conexão');
    (api.uploadMultipart as jest.Mock).mockRejectedValue(falha);

    const resultado = await prontuarioService.registrarExameComLaudo('10', { nome: 'Hemograma', resultadoEm: '2026-03-20' },
      { uri: 'file:///laudo.pdf', nome: 'laudo.pdf', tipoMime: 'application/pdf' });

    expect(resultado.exameId).toBe('7');
    expect(resultado.erroArquivo).toBe(falha);
  });

  it('propaga o erro quando o cadastro do exame falha (nada é enviado)', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('403'));

    await expect(prontuarioService.registrarExameComLaudo('10', { nome: 'x', resultadoEm: '2026-03-20' },
      { uri: 'file:///a.pdf', nome: 'a.pdf', tipoMime: 'application/pdf' })).rejects.toThrow('403');
    expect(api.uploadMultipart).not.toHaveBeenCalled();
  });

  it('lista e remove exames', async () => {
    (api.get as jest.Mock).mockResolvedValue([dtoExame]);
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    const lista = await prontuarioService.listarExames('10');
    await prontuarioService.removerExame('10', '7');

    expect(api.get).toHaveBeenCalledWith('/pets/10/exames');
    expect(api.delete).toHaveBeenCalledWith('/pets/10/exames/7');
    expect(lista[0].eventoId).toBe('100');
  });

  it('cria o compartilhamento devolvendo a URL pública', async () => {
    (api.post as jest.Mock).mockResolvedValue({ id: 3, urlPublica: 'https://x/prontuarios-publicos/abc', expiraEm: '2026-10-17T10:00:00', secoes: ['EXAMES'] });

    const criado = await prontuarioService.criarCompartilhamento('10', { secoes: ['EXAMES'], validadeDias: 7, destinatario: 'Clínica Norte' });

    expect(api.post).toHaveBeenCalledWith('/pets/10/prontuario/compartilhamentos', {
      secoes: ['EXAMES'], validadeDias: 7, destinatario: 'Clínica Norte',
    });
    expect(criado).toEqual({ id: '3', urlPublica: 'https://x/prontuarios-publicos/abc', expiraEm: '2026-10-17T10:00:00', secoes: ['EXAMES'] });
  });

  it('lista e revoga compartilhamentos', async () => {
    (api.get as jest.Mock).mockResolvedValue([{ id: 3, destinatario: null, secoes: ['EXAMES'], periodoInicio: null, periodoFim: null, criadaEm: 'a', expiraEm: 'b', revogadaEm: null, ultimoAcessoEm: null, totalAcessos: 2, ativo: true }]);
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    const lista = await prontuarioService.listarCompartilhamentos('10');
    await prontuarioService.revogarCompartilhamento('10', '3');

    expect(api.get).toHaveBeenCalledWith('/pets/10/prontuario/compartilhamentos');
    expect(api.delete).toHaveBeenCalledWith('/pets/10/prontuario/compartilhamentos/3');
    expect(lista[0]).toMatchObject({ id: '3', totalAcessos: 2, ativo: true });
  });
});
