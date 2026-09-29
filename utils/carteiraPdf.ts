import { ESPECIES } from '../constants';
import type { Pet } from '../types';
import type { CarteiraVacinacao, Vacina } from '../services/petHealthService';
import { parseDataEvento } from './eventoStatus';

const SEM_INFORMACAO = '—';

const STATUS_VACINA: Record<string, { texto: string; cor: string; fundo: string }> = {
  EM_DIA: { texto: 'Em dia', cor: '#166534', fundo: '#dcfce7' },
  VENCENDO: { texto: 'Vencendo', cor: '#92400e', fundo: '#fef3c7' },
  ATRASADA: { texto: 'Atrasada', cor: '#991b1b', fundo: '#fee2e2' },
  FUTURA: { texto: 'Futura', cor: '#1e40af', fundo: '#dbeafe' },
};

export function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textoOuTraco(valor?: string | null): string {
  const limpo = valor?.trim();
  return limpo ? escaparHtml(limpo) : SEM_INFORMACAO;
}

export function formatarDataPdf(valor?: string | null): string {
  if (!valor) return SEM_INFORMACAO;
  const data = parseDataEvento(valor);
  if (Number.isNaN(data.getTime())) return SEM_INFORMACAO;
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatarPeso(peso?: string | null): string {
  const limpo = peso?.trim();
  if (!limpo) return SEM_INFORMACAO;
  return /^\d+([.,]\d+)?$/.test(limpo) ? `${escaparHtml(limpo)} kg` : escaparHtml(limpo);
}

function formatarSexo(sexo: Pet['sexo']): string {
  return sexo === 'femea' ? 'Fêmea' : sexo === 'macho' ? 'Macho' : SEM_INFORMACAO;
}

/** Nome do arquivo sem acentos/espaços, ex.: "carteira-luna-da-silva.pdf". */
export function nomeArquivoCarteiraPdf(pet: Pick<Pet, 'nome'>): string {
  const slug = pet.nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `carteira-${slug || 'pet'}.pdf`;
}

function campo(rotulo: string, valorHtml: string): string {
  return `<div class="campo"><span class="rotulo">${rotulo}</span><span class="valor">${valorHtml}</span></div>`;
}

function linhaVacina(vacina: Vacina): string {
  const status = STATUS_VACINA[vacina.status] ?? { texto: vacina.status, cor: '#374151', fundo: '#f3f4f6' };
  return `<tr>
    <td class="nome">${textoOuTraco(vacina.nome)}</td>
    <td>${formatarDataPdf(vacina.aplicadaEm)}</td>
    <td>${formatarDataPdf(vacina.proximaDoseEm)}</td>
    <td>${textoOuTraco(vacina.veterinario)}</td>
    <td><span class="status" style="color:${status.cor};background:${status.fundo}">${escaparHtml(status.texto)}</span></td>
  </tr>`;
}

function ordenarVacinas(vacinas: Vacina[]): Vacina[] {
  const tempo = (vacina: Vacina) => {
    const referencia = vacina.aplicadaEm ?? vacina.proximaDoseEm;
    if (!referencia) return Number.POSITIVE_INFINITY;
    const valor = parseDataEvento(referencia).getTime();
    return Number.isNaN(valor) ? Number.POSITIVE_INFINITY : valor;
  };
  return [...vacinas].sort((a, b) => tempo(a) - tempo(b));
}

const ESTILOS = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1512; }
  .pagina { padding: 40px 44px; page-break-after: always; break-after: page; }
  .pagina:last-child { page-break-after: auto; break-after: auto; }
  .marca { color: #0e3326; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; }
  h1 { font-size: 22px; margin: 6px 0 4px; color: #0e3326; }
  .sub { color: #7a6a5e; font-size: 12px; margin: 0 0 24px; }
  .cartao { background: #0e3326; color: #ffffff; border-radius: 18px; padding: 28px; margin-top: 8px; }
  .cartao-topo { display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 800; letter-spacing: 1.1px; text-transform: uppercase; color: #f2c879; }
  .cartao-corpo { display: flex; align-items: center; gap: 20px; margin: 26px 0; }
  .avatar { width: 84px; height: 84px; border-radius: 50%; background: #f2c879; color: #0e3326; font-size: 38px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex: none; }
  .pet-nome { font-size: 30px; font-weight: 800; margin: 0; word-break: break-word; }
  .pet-meta { font-size: 14px; margin: 4px 0 0; color: #d6e6dc; }
  .cartao-rodape { font-size: 10px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; color: #d6e6dc; }
  .dados { display: flex; flex-wrap: wrap; margin-top: 28px; border: 1px solid #e6e0d6; border-radius: 14px; overflow: hidden; }
  .campo { width: 50%; padding: 14px 18px; border-bottom: 1px solid #e6e0d6; }
  .campo:nth-child(odd) { border-right: 1px solid #e6e0d6; }
  .rotulo { display: block; font-size: 10px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; color: #7a6a5e; }
  .valor { display: block; font-size: 15px; font-weight: 700; margin-top: 4px; word-break: break-word; }
  .resumo { display: flex; border: 1px solid #e6e0d6; border-radius: 14px; margin: 18px 0 22px; overflow: hidden; }
  .resumo div { flex: 1; text-align: center; padding: 14px 6px; border-right: 1px solid #e6e0d6; }
  .resumo div:last-child { border-right: 0; }
  .resumo strong { display: block; font-size: 24px; color: #0e3326; }
  .resumo span { font-size: 11px; color: #7a6a5e; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; font-size: 10px; letter-spacing: 0.8px; text-transform: uppercase; color: #7a6a5e; padding: 8px 10px; border-bottom: 2px solid #0e3326; }
  td { padding: 10px; border-bottom: 1px solid #e6e0d6; vertical-align: top; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  td.nome { font-weight: 800; }
  .status { display: inline-block; border-radius: 8px; padding: 3px 8px; font-size: 11px; font-weight: 800; white-space: nowrap; }
  .vazio { text-align: center; color: #7a6a5e; padding: 28px 10px; }
  .aviso { margin-top: 24px; font-size: 10px; line-height: 1.5; color: #7a6a5e; }
`;

export interface DadosCarteiraPdf {
  pet: Pet;
  carteira: CarteiraVacinacao;
  geradoEm?: Date;
}

/**
 * Monta o HTML do PDF: página 1 = carteirinha (identificação do pet),
 * página 2 em diante = carteira de vacinação. Todo texto vindo da API é escapado.
 */
export function montarHtmlCarteiraPdf({ pet, carteira, geradoEm = new Date() }: DadosCarteiraPdf): string {
  const especie = ESPECIES.find(item => item.valor === pet.especie)?.label ?? 'Espécie não informada';
  const raca = pet.raca?.trim() ? ` · ${escaparHtml(pet.raca.trim())}` : '';
  const inicial = escaparHtml((pet.nome.trim()[0] ?? '?').toLocaleUpperCase('pt-BR'));
  const vacinas = ordenarVacinas(carteira.vacinas ?? []);
  const resumo = carteira.resumo ?? { emDia: 0, vencendo: 0, atrasadas: 0, futuras: 0 };
  const emissao = geradoEm.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  const corpoTabela = vacinas.length
    ? vacinas.map(linhaVacina).join('')
    : '<tr><td class="vazio" colspan="5">Nenhuma vacina registrada até o momento.</td></tr>';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escaparHtml(nomeArquivoCarteiraPdf(pet))}</title>
<style>${ESTILOS}</style>
</head>
<body>
  <section class="pagina">
    <div class="marca">VetSync</div>
    <h1>Carteirinha do pet</h1>
    <p class="sub">Documento de identificação digital</p>
    <div class="cartao">
      <div class="cartao-topo"><span>Carteirinha</span><span>VetSync</span></div>
      <div class="cartao-corpo">
        <div class="avatar">${inicial}</div>
        <div>
          <p class="pet-nome">${escaparHtml(pet.nome)}</p>
          <p class="pet-meta">${escaparHtml(especie)}${raca}</p>
        </div>
      </div>
      <div class="cartao-rodape">Documento digital</div>
    </div>
    <div class="dados">
      ${campo('Espécie', escaparHtml(especie))}
      ${campo('Raça', textoOuTraco(pet.raca))}
      ${campo('Sexo', formatarSexo(pet.sexo))}
      ${campo('Nascimento', formatarDataPdf(pet.dataNascimento))}
      ${campo('Peso', formatarPeso(pet.peso))}
      ${campo('Nº do pet', textoOuTraco(pet.numero))}
      ${campo('Tutor', textoOuTraco(pet.tutor?.nome))}
      ${campo('Contato do tutor', textoOuTraco(pet.tutor?.telefone ?? pet.tutor?.email))}
    </div>
    <p class="aviso">Emitido em ${escaparHtml(emissao)}.</p>
  </section>

  <section class="pagina">
    <div class="marca">VetSync</div>
    <h1>Carteira de vacinação</h1>
    <p class="sub">${escaparHtml(pet.nome)} · ${escaparHtml(especie)}${raca}</p>
    <div class="resumo">
      <div><strong>${resumo.emDia}</strong><span>Em dia</span></div>
      <div><strong>${resumo.vencendo}</strong><span>Vencendo</span></div>
      <div><strong>${resumo.atrasadas}</strong><span>Atrasadas</span></div>
      <div><strong>${resumo.futuras}</strong><span>Futuras</span></div>
    </div>
    <table>
      <thead><tr><th>Vacina</th><th>Aplicada em</th><th>Próxima dose</th><th>Veterinário</th><th>Situação</th></tr></thead>
      <tbody>${corpoTabela}</tbody>
    </table>
    <p class="aviso">Esta carteira exibe somente registros disponíveis na conta do tutor no VetSync, emitida em ${escaparHtml(emissao)}. Para incluir ou corrigir uma vacina, fale com a clínica responsável.</p>
  </section>
</body>
</html>`;
}