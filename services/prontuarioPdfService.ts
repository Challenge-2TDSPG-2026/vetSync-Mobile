import { prontuarioService, type FiltrosProntuario } from './prontuarioService';
import { compartilhamentoNativoService } from './compartilhamentoNativoService';
import { montarHtmlProntuario, nomeArquivoProntuarioPdf } from '../utils/prontuarioPdf';

export const prontuarioPdfService = {
  /**
   * Busca a versão exportável do prontuário (registra a exportação na auditoria do servidor)
   * e abre o PDF para compartilhar ou imprimir.
   */
  async exportarECompartilhar(idPet: string, filtros: FiltrosProntuario = {}): Promise<void> {
    const prontuario = await prontuarioService.exportar(idPet, filtros);
    await compartilhamentoNativoService.compartilharHtmlComoPdf(
      montarHtmlProntuario(prontuario),
      nomeArquivoProntuarioPdf(prontuario.pet.nome),
      `Prontuário de ${prontuario.pet.nome}`
    );
  },
};
