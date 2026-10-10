import type { Prontuario } from '../services/prontuarioService';
import { escaparHtmlEmergencia } from './resumoEmergenciaPdf';
import { formatarDataHoraProntuario, formatarDataProntuario, slugDoPet } from './prontuario';

const esc = escaparHtmlEmergencia;

function texto(valor?: string | null): string {
  return valor?.trim() ? esc(valor.trim()).replace(/\n/g, '<br />') : '';
}

function campo(rotulo: string, valor?: string | null): string {
  const conteudo = texto(valor);
  return conteudo ? `<p class="campo"><span>${esc(rotulo)}</span>${conteudo}</p>` : '';
}

function secao(titulo: string, conteudo: string): string {
  return `<section><h2>${esc(titulo)}</h2>${conteudo}</section>`;
}

function vazio(mensagem: string): string {
  return `<p class="vazio">${esc(mensagem)}</p>`;
}

export function nomeArquivoProntuarioPdf(nomePet: string, hoje: Date = new Date()): string {
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `prontuario-${slugDoPet(nomePet)}-${ano}${mes}${dia}.pdf`;
}

/**
 * Monta o HTML (A4) do prontuário. Recebe o resultado de `exportar`, que já vem sem custos,
 * sem observações do tutor e só com receitas liberadas.
 */
export function montarHtmlProntuario(prontuario: Prontuario): string {
  const { pet } = prontuario;
  const mostra = (chave: Prontuario['secoes'][number]) => prontuario.secoes.includes(chave);
  const blocos: string[] = [];

  if (mostra('PERFIL_SAUDE')) {
    const perfil = prontuario.perfilSaude;
    blocos.push(
      secao(
        'Perfil de saúde',
        perfil
          ? [
              campo('Peso atual', perfil.pesoAtual != null ? `${perfil.pesoAtual} kg` : null),
              campo('Alergias', perfil.alergias),
              campo('Medicamentos contínuos', perfil.medicamentosContinuos),
              campo('Condições pré-existentes', perfil.condicoesPreExistentes),
              campo('Restrições alimentares', perfil.restricoesAlimentares),
              campo('Observações importantes', perfil.observacoesImportantes),
            ].join('') || vazio('Nenhuma informação registrada.')
          : vazio('Nenhuma informação registrada.')
      )
    );
  }

  if (mostra('ATENDIMENTOS')) {
    blocos.push(
      secao(
        'Atendimentos',
        prontuario.atendimentos.length
          ? prontuario.atendimentos
              .map(a => `<div class="item"><h3>${esc(a.tipo ?? 'Atendimento')}</h3>
                <p class="meta">${esc(formatarDataProntuario(a.data))}${a.hora ? ` às ${esc(a.hora)}` : ''}${a.veterinario ? ` · ${esc(a.veterinario)}${a.crmv ? ` (CRMV ${esc(a.crmv)})` : ''}` : ''}${a.clinica ? ` · ${esc(a.clinica)}` : ''}</p>
                ${campo('Diagnóstico', a.diagnostico)}${campo('Conduta', a.conduta)}${campo('Observações clínicas', a.observacaoClinica)}</div>`)
              .join('')
          : vazio('Nenhum atendimento concluído no período.')
      )
    );
  }

  if (mostra('ORIENTACOES')) {
    blocos.push(
      secao(
        'Orientações',
        prontuario.orientacoes.length
          ? prontuario.orientacoes
              .map(o => `<div class="item"><h3>${esc(o.titulo)}</h3>
                <p class="meta">${esc(formatarDataProntuario(o.criadaEm))}${o.autor ? ` · ${esc(o.autor)}` : ''}</p>${campo('', o.texto)}</div>`)
              .join('')
          : vazio('Nenhuma orientação registrada no período.')
      )
    );
  }

  if (mostra('RECEITAS')) {
    blocos.push(
      secao(
        'Receitas',
        prontuario.receitas.length
          ? prontuario.receitas
              .map(r => `<div class="item"><h3>${esc(r.medicamento)}${r.principioAtivo ? ` <small>(${esc(r.principioAtivo)})</small>` : ''}</h3>
                <p class="meta">Início ${esc(formatarDataProntuario(r.inicio))}${r.fim ? ` · fim ${esc(formatarDataProntuario(r.fim))}` : ''}${r.dosesPorDia != null ? ` · ${r.dosesPorDia} dose(s) por dia` : ''}</p>${campo('', r.posologia)}</div>`)
              .join('')
          : vazio('Nenhuma receita no período.')
      )
    );
  }

  if (mostra('EXAMES')) {
    blocos.push(
      secao(
        'Resultados de exames',
        prontuario.exames.length
          ? prontuario.exames
              .map(x => `<div class="item"><h3>${esc(x.nome)}</h3>
                <p class="meta">Resultado em ${esc(formatarDataProntuario(x.resultadoEm))}${x.coletadoEm ? ` · coleta ${esc(formatarDataProntuario(x.coletadoEm))}` : ''}${x.laboratorio ? ` · ${esc(x.laboratorio)}` : ''}</p>
                ${campo('Resultado', x.resultado)}${campo('Interpretação', x.interpretacao)}
                ${x.temArquivo ? '<p class="meta">Laudo em arquivo disponível no VetSync.</p>' : ''}</div>`)
              .join('')
          : vazio('Nenhum exame no período.')
      )
    );
  }

  const identificacao = [pet.numero ? `Nº ${esc(pet.numero)}` : '', pet.especie ? esc(pet.especie) : '', pet.raca ? esc(pet.raca) : '']
    .filter(Boolean)
    .join(' · ');
  const periodo =
    prontuario.periodoInicio || prontuario.periodoFim
      ? `<p class="meta">Período: ${esc(formatarDataProntuario(prontuario.periodoInicio, 'início'))} a ${esc(formatarDataProntuario(prontuario.periodoFim, 'hoje'))}</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8" /><title>Prontuário de ${esc(pet.nome)}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1f2a24; font-size: 12px; line-height: 1.5; }
  header { border-bottom: 3px solid #1f7a4d; padding-bottom: 10px; margin-bottom: 14px; }
  header .selo { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #1f7a4d; margin: 0; }
  header h1 { margin: 2px 0; font-size: 24px; }
  section { margin-bottom: 16px; }
  h2 { font-size: 15px; margin: 0 0 8px; color: #1f7a4d; border-bottom: 1px solid #d9e2dc; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 0; }
  h3 small { font-weight: normal; color: #5b665f; }
  .item { padding: 8px 0; border-bottom: 1px solid #eef1ef; page-break-inside: avoid; }
  .meta { color: #5b665f; font-size: 11px; margin: 2px 0 4px; }
  .campo { margin: 4px 0; }
  .campo span { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #5b665f; }
  .vazio { color: #5b665f; font-style: italic; }
  footer { margin-top: 18px; font-size: 10px; color: #7a847d; text-align: center; }
</style></head><body>
<header>
  <p class="selo">Prontuário clínico · VetSync</p>
  <h1>${esc(pet.nome)}</h1>
  <p class="meta">${identificacao}${pet.nascimento ? ` · Nascimento ${esc(formatarDataProntuario(pet.nascimento))}` : ''}</p>
  ${periodo}
  <p class="meta">Gerado em ${esc(formatarDataHoraProntuario(prontuario.geradoEm))}</p>
</header>
${blocos.join('\n')}
<footer>Documento gerado pelo VetSync. Não inclui custos nem dados pessoais do tutor. As informações não substituem a avaliação do veterinário responsável.</footer>
</body></html>`;
}
