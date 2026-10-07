import { ESPECIES } from '../constants';
import type { PerfilSaudePet, Pet } from '../types';
import type { LogosPdf } from './carteiraPdf';

const NAO_INFORMADO = 'Não informado';

export function escaparHtmlEmergencia(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function texto(valor?: string | null): string {
  return escaparHtmlEmergencia(valor?.trim() || NAO_INFORMADO);
}

function data(valor?: string | null): string {
  const iso = valor?.slice(0, 10);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return NAO_INFORMADO;
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function campo(rotulo: string, valor: string, largura = ''): string {
  return `<td class="campo"${largura}><span>${escaparHtmlEmergencia(rotulo)}</span><br /><strong>${valor}</strong></td>`;
}

function linha(campoEsquerdo: string, campoDireito?: string): string {
  return `<tr>${campoEsquerdo}${campoDireito ?? '<td class="campo vazio"></td>'}</tr>`;
}

function secao(titulo: string, origem: string, campos: string): string {
  return `<table class="bloco">
    <thead><tr><th colspan="2"><h2>${escaparHtmlEmergencia(titulo)}</h2><small>Origem: ${escaparHtmlEmergencia(origem)}</small></th></tr></thead>
    <tbody>${campos}</tbody>
  </table>`;
}

function imagemLogo(src?: string | null): string {
  return src && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(src)
    ? `<img src="${src}" alt="" />`
    : '';
}

function fotoPet(src: string | null | undefined, inicial: string): string {
  return src && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src)
    ? `<img class="foto" src="${src}" alt="" />`
    : `<div class="inicial">${escaparHtmlEmergencia(inicial)}</div>`;
}

export function nomeArquivoResumoEmergenciaPdf(pet: Pick<Pet, 'nome'>): string {
  const slug = pet.nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `emergencia-${slug || 'pet'}.pdf`;
}

type DadosResumoEmergenciaPdf = {
  pet: Pet;
  perfil: PerfilSaudePet;
  geradoEm?: Date;
  logos?: LogosPdf;
  fotoDataUri?: string | null;
};

export function montarHtmlResumoEmergencia({
  pet,
  perfil,
  geradoEm = new Date(),
  logos = {},
  fotoDataUri,
}: DadosResumoEmergenciaPdf): string {
  const especie = ESPECIES.find(item => item.valor === pet.especie)?.label ?? NAO_INFORMADO;
  const sexo = pet.sexo === 'femea' ? 'Fêmea' : pet.sexo === 'macho' ? 'Macho' : NAO_INFORMADO;
  const peso = pet.peso?.trim() ? `${escaparHtmlEmergencia(pet.peso.trim())} kg` : NAO_INFORMADO;
  const inicial = (pet.nome.trim()[0] ?? '?').toLocaleUpperCase('pt-BR');
  const emissao = geradoEm.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  const identificacao = [
    linha(campo('Espécie', escaparHtmlEmergencia(especie)), campo('Raça', texto(pet.raca))),
    linha(campo('Sexo', sexo), campo('Nascimento', data(pet.dataNascimento))),
    linha(campo('Peso', peso), campo('Identificação', texto(pet.numero || pet.id))),
  ].join('');

  const tutor = [
    linha(campo('Responsável', texto(pet.tutor?.nome)), campo('Telefone', texto(pet.tutor?.telefone))),
    linha(campo('E-mail', texto(pet.tutor?.email)), campo('Contato de emergência', texto(perfil.contatoEmergencia))),
  ].join('');

  const saude = [
    linha(campo('Alergias', texto(perfil.alergias)), campo('Medicamentos contínuos', texto(perfil.medicamentosContinuos))),
    linha(campo('Restrições alimentares', texto(perfil.restricoesAlimentares)), campo('Condições preexistentes', texto(perfil.condicoesPreExistentes))),
    `<tr>${campo('Observações importantes', texto(perfil.observacoesImportantes), ' colspan="2"')}</tr>`,
  ].join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escaparHtmlEmergencia(nomeArquivoResumoEmergenciaPdf(pet))}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1512; background: #fff; }
  main { padding: 34px 40px 30px; }
  table { width: 100%; border-collapse: collapse; }
  .cabecalho { border-bottom: 4px solid #dc3545; }
  .cabecalho td { padding: 0 0 13px; vertical-align: middle; }
  .cabecalho td:last-child { text-align: right; }
  .marca { white-space: nowrap; }
  .marca img { width: 42px; height: auto; }
  .marca-conteudo { display: inline-block; vertical-align: middle; margin-left: 10px; }
  .marca strong { display: block; color: #0e3326; font-size: 21px; }
  .marca span, .emissao { color: #7a6a5e; font-size: 10px; }
  .emissao { text-align: right; line-height: 1.5; }
  .titulo { margin: 18px 0 14px; background: #0e3326; color: #fff; }
  .titulo td { padding: 16px; vertical-align: middle; }
  .titulo td:first-child { width: 82px; }
  .titulo h1 { color: #ffffff; }
  .titulo p { color: #d6e6dc; }
  .foto, .inicial { width: 72px; height: 72px; border-radius: 50%; border: 3px solid #f2c879; flex: none; }
  .foto { object-fit: cover; }
  .inicial { display: flex; align-items: center; justify-content: center; background: #f2c879; color: #0e3326; font-size: 30px; font-weight: 800; }
  h1 { margin: 0; font-size: 25px; }
  .titulo p { margin: 5px 0 0; color: #d6e6dc; font-size: 12px; }
  .bloco { margin-top: 12px; border: 1px solid #e6e0d6; page-break-inside: avoid; }
  .bloco th { padding: 8px 12px; text-align: left; background: #f6f2ec; border-bottom: 1px solid #e6e0d6; }
  h2 { margin: 0; color: #0e3326; font-size: 15px; }
  small { display: block; color: #7a6a5e; font-size: 9px; font-weight: 400; margin-top: 2px; }
  .campo { width: 50%; padding: 11px 14px; border-bottom: 1px solid #eee9e2; }
  .campo:first-child { border-right: 1px solid #eee9e2; }
  .bloco tr:last-child .campo { border-bottom: 0; }
  .campo.vazio { background: #fff; }
  .campo span { display: block; color: #7a6a5e; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; }
  .campo strong { display: block; margin-top: 4px; font-size: 12px; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; }
  footer { margin-top: 14px; padding-top: 9px; border-top: 1px solid #e6e0d6; color: #7a6a5e; font-size: 9px; line-height: 1.45; }
</style>
</head>
<body><main>
  <table class="cabecalho"><tr>
    <td class="marca">${imagemLogo(logos.cor)}<div class="marca-conteudo"><strong>VetSync</strong><br /><span>Ficha rápida de emergência</span></div></td>
    <td class="emissao">Documento gerado em<br /><strong>${escaparHtmlEmergencia(emissao)}</strong></td>
  </tr></table>
  <table class="titulo"><tr><td>${fotoPet(fotoDataUri, inicial)}</td><td><h1>${texto(pet.nome)}</h1><p>${escaparHtmlEmergencia(especie)}${pet.raca?.trim() ? ` · ${escaparHtmlEmergencia(pet.raca.trim())}` : ''}</p></td></tr></table>
  ${secao('Identificação do pet', 'cadastro do pet', identificacao)}
  ${secao('Contatos', 'cadastro do tutor e perfil de saúde do pet', tutor)}
  ${secao('Informações de saúde', 'perfil de saúde do pet', saude)}
  <footer>Esta ficha reproduz os dados disponíveis no VetSync no momento da geração. Campos sem registro aparecem como “Não informado”. Em uma emergência, procure atendimento veterinário presencial.</footer>
</main></body>
</html>`;
}
