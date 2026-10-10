import { api, type ArquivoUpload } from './api/httpClient';
import { montarQueryProntuario } from '../utils/prontuario';

export type SecaoProntuario = 'PERFIL_SAUDE' | 'ATENDIMENTOS' | 'ORIENTACOES' | 'RECEITAS' | 'EXAMES';

export interface FiltrosProntuario {
  secoes?: SecaoProntuario[];
  /** Data inicial (AAAA-MM-DD), inclusiva. */
  de?: string;
  /** Data final (AAAA-MM-DD), inclusiva. */
  ate?: string;
}

export interface PetResumoProntuario {
  id: string;
  numero: string | null;
  nome: string;
  especie: string | null;
  raca: string | null;
  sexo: string | null;
  nascimento: string | null;
}

export interface PerfilResumoProntuario {
  pesoAtual: number | null;
  pesoAtualizadoEm: string | null;
  alergias: string | null;
  medicamentosContinuos: string | null;
  restricoesAlimentares: string | null;
  condicoesPreExistentes: string | null;
  observacoesImportantes: string | null;
}

export interface AtendimentoProntuario {
  id: string;
  data: string;
  hora: string | null;
  tipo: string | null;
  categoria: string | null;
  veterinario: string | null;
  crmv: string | null;
  clinica: string | null;
  diagnostico: string | null;
  conduta: string | null;
  observacaoClinica: string | null;
}

export interface OrientacaoProntuario {
  id: string;
  eventoId: string;
  dataAtendimento: string | null;
  titulo: string;
  texto: string;
  autor: string | null;
  criadaEm: string;
}

export interface ReceitaProntuario {
  id: string;
  eventoId: string;
  medicamento: string;
  principioAtivo: string | null;
  posologia: string;
  inicio: string;
  fim: string | null;
  dosesPorDia: number | null;
  status: string;
}

export interface ExameProntuario {
  id: string;
  eventoId: string | null;
  nome: string;
  laboratorio: string | null;
  coletadoEm: string | null;
  resultadoEm: string;
  resultado: string | null;
  interpretacao: string | null;
  veterinario: string | null;
  temArquivo: boolean;
  arquivoNome: string | null;
}

export type TipoEntradaProntuario = 'ATENDIMENTO' | 'ORIENTACAO' | 'RECEITA' | 'EXAME';

export interface EntradaLinhaDoTempo {
  tipo: TipoEntradaProntuario;
  id: string;
  data: string | null;
  titulo: string | null;
  eventoId: string | null;
}

export interface Prontuario {
  versao: number;
  geradoEm: string;
  secoes: SecaoProntuario[];
  periodoInicio: string | null;
  periodoFim: string | null;
  pet: PetResumoProntuario;
  perfilSaude: PerfilResumoProntuario | null;
  atendimentos: AtendimentoProntuario[];
  orientacoes: OrientacaoProntuario[];
  receitas: ReceitaProntuario[];
  exames: ExameProntuario[];
  linhaDoTempo: EntradaLinhaDoTempo[];
}

export interface DadosExame {
  idEvento?: string | null;
  nome: string;
  laboratorio?: string;
  /** AAAA-MM-DD */
  coletadoEm?: string;
  /** AAAA-MM-DD */
  resultadoEm: string;
  resultado?: string;
  interpretacao?: string;
}

export interface DadosCompartilhamento {
  secoes?: SecaoProntuario[];
  destinatario?: string;
  validadeDias?: number;
  periodoInicio?: string;
  periodoFim?: string;
}

export interface ResultadoRegistroExame {
  exameId: string;
  /** Preenchido quando o exame foi salvo mas o envio do arquivo falhou. */
  erroArquivo: Error | null;
}

export interface CompartilhamentoProntuario {
  id: string;
  destinatario: string | null;
  secoes: SecaoProntuario[];
  periodoInicio: string | null;
  periodoFim: string | null;
  criadaEm: string;
  expiraEm: string;
  revogadaEm: string | null;
  ultimoAcessoEm: string | null;
  totalAcessos: number;
  ativo: boolean;
}

export interface CompartilhamentoCriado {
  id: string;
  urlPublica: string;
  expiraEm: string;
  secoes: SecaoProntuario[];
}

type Id = number | string;
const texto = (id: Id): string => String(id);
const textoOuNulo = (id: Id | null | undefined): string | null => (id === null || id === undefined ? null : String(id));

type ProntuarioApi = Omit<Prontuario, 'pet' | 'atendimentos' | 'orientacoes' | 'receitas' | 'exames' | 'linhaDoTempo'> & {
  pet: Omit<PetResumoProntuario, 'id'> & { id: Id };
  atendimentos: (Omit<AtendimentoProntuario, 'id'> & { id: Id })[];
  orientacoes: (Omit<OrientacaoProntuario, 'id' | 'eventoId'> & { id: Id; eventoId: Id })[];
  receitas: (Omit<ReceitaProntuario, 'id' | 'eventoId'> & { id: Id; eventoId: Id })[];
  exames: (Omit<ExameProntuario, 'id' | 'eventoId'> & { id: Id; eventoId: Id | null })[];
  linhaDoTempo: (Omit<EntradaLinhaDoTempo, 'id' | 'eventoId'> & { id: Id; eventoId: Id | null })[];
};

type ExameApi = ProntuarioApi['exames'][number];
type OrientacaoApi = ProntuarioApi['orientacoes'][number];

function paraExame(dto: ExameApi): ExameProntuario {
  return { ...dto, id: texto(dto.id), eventoId: textoOuNulo(dto.eventoId) };
}

function paraOrientacao(dto: OrientacaoApi): OrientacaoProntuario {
  return { ...dto, id: texto(dto.id), eventoId: texto(dto.eventoId) };
}

function paraProntuario(dto: ProntuarioApi): Prontuario {
  return {
    ...dto,
    pet: { ...dto.pet, id: texto(dto.pet.id) },
    atendimentos: dto.atendimentos.map(item => ({ ...item, id: texto(item.id) })),
    orientacoes: dto.orientacoes.map(paraOrientacao),
    receitas: dto.receitas.map(item => ({ ...item, id: texto(item.id), eventoId: texto(item.eventoId) })),
    exames: dto.exames.map(paraExame),
    linhaDoTempo: dto.linhaDoTempo.map(item => ({ ...item, id: texto(item.id), eventoId: textoOuNulo(item.eventoId) })),
  };
}

type CompartilhamentoApi = Omit<CompartilhamentoProntuario, 'id'> & { id: Id };
type CompartilhamentoCriadoApi = Omit<CompartilhamentoCriado, 'id'> & { id: Id };

export const prontuarioService = {
  /** Visão interna: inclui receitas ainda não liberadas pela clínica. */
  async consultar(idPet: string, filtros: FiltrosProntuario = {}): Promise<Prontuario> {
    const dto = await api.get<ProntuarioApi>(`/pets/${idPet}/prontuario${montarQueryProntuario(filtros)}`);
    return paraProntuario(dto);
  },

  /** Versão que sai do sistema (só receitas liberadas); a exportação fica registrada na auditoria. */
  async exportar(idPet: string, filtros: FiltrosProntuario = {}): Promise<Prontuario> {
    const query = montarQueryProntuario(filtros, 'JSON');
    const dto = await api.get<ProntuarioApi>(`/pets/${idPet}/prontuario/exportar${query}`);
    return paraProntuario(dto);
  },

  async listarOrientacoes(idEvento: string): Promise<OrientacaoProntuario[]> {
    const dto = await api.get<OrientacaoApi[]>(`/eventos/${idEvento}/orientacoes`);
    return dto.map(paraOrientacao);
  },

  async criarOrientacao(idEvento: string, dados: { titulo: string; texto: string }): Promise<OrientacaoProntuario> {
    const dto = await api.post<OrientacaoApi>(`/eventos/${idEvento}/orientacoes`, dados);
    return paraOrientacao(dto);
  },

  async removerOrientacao(idEvento: string, idOrientacao: string): Promise<void> {
    await api.delete(`/eventos/${idEvento}/orientacoes/${idOrientacao}`);
  },

  async listarExames(idPet: string): Promise<ExameProntuario[]> {
    const dto = await api.get<ExameApi[]>(`/pets/${idPet}/exames`);
    return dto.map(paraExame);
  },

  async registrarExame(idPet: string, dados: DadosExame): Promise<ExameProntuario> {
    const dto = await api.post<ExameApi>(`/pets/${idPet}/exames`, {
      ...dados,
      idEvento: dados.idEvento ? Number(dados.idEvento) : undefined,
    });
    return paraExame(dto);
  },

  async anexarArquivoExame(idPet: string, idExame: string, arquivo: ArquivoUpload): Promise<ExameProntuario> {
    const dto = await api.uploadMultipart<ExameApi>(`/pets/${idPet}/exames/${idExame}/arquivo`, arquivo, true, {
      campo: 'arquivo',
      metodo: 'POST',
      descricao: 'laudo',
    });
    return paraExame(dto);
  },

  /**
   * Registra o exame e, se houver arquivo, envia o laudo em seguida. Se só o envio falhar, o exame
   * continua salvo: o erro volta em `erroArquivo` em vez de se perder o cadastro.
   */
  async registrarExameComLaudo(
    idPet: string,
    dados: DadosExame,
    arquivo?: ArquivoUpload | null
  ): Promise<ResultadoRegistroExame> {
    const exame = await this.registrarExame(idPet, dados);
    if (!arquivo) return { exameId: exame.id, erroArquivo: null };
    try {
      await this.anexarArquivoExame(idPet, exame.id, arquivo);
      return { exameId: exame.id, erroArquivo: null };
    } catch (erro) {
      return { exameId: exame.id, erroArquivo: erro instanceof Error ? erro : new Error('Falha ao enviar o laudo.') };
    }
  },

  async removerExame(idPet: string, idExame: string): Promise<void> {
    await api.delete(`/pets/${idPet}/exames/${idExame}`);
  },

  async listarCompartilhamentos(idPet: string): Promise<CompartilhamentoProntuario[]> {
    const dto = await api.get<CompartilhamentoApi[]>(`/pets/${idPet}/prontuario/compartilhamentos`);
    return dto.map(item => ({ ...item, id: texto(item.id) }));
  },

  /**
   * A URL pública só é devolvida nesta resposta. Ela deve ficar em memória na tela
   * e nunca ser persistida no dispositivo.
   */
  async criarCompartilhamento(idPet: string, dados: DadosCompartilhamento): Promise<CompartilhamentoCriado> {
    const dto = await api.post<CompartilhamentoCriadoApi>(`/pets/${idPet}/prontuario/compartilhamentos`, dados);
    return { ...dto, id: texto(dto.id) };
  },

  async revogarCompartilhamento(idPet: string, idCompartilhamento: string): Promise<void> {
    await api.delete(`/pets/${idPet}/prontuario/compartilhamentos/${idCompartilhamento}`);
  },
};
