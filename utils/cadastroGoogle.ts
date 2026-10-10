export function formatarCpf(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`;
}

export function formatarTelefone(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
}

export type CamposCadastroGoogle = {
  /** Obrigatório só quando o token do Google não trouxe o nome. */
  nome: string;
  exigirNome: boolean;
  cpf: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
};

/** Mesmas regras do cadastro com e-mail e senha, menos e-mail e senha (o Google já os fornece). */
export function validarCadastroGoogle(campos: CamposCadastroGoogle): Record<string, string> {
  const erros: Record<string, string> = {};
  if (campos.exigirNome && campos.nome.trim().length < 2) erros.nome = 'Informe seu nome completo';
  if (campos.cpf.replace(/\D/g, '').length !== 11) erros.cpf = 'CPF deve conter 11 dígitos';
  const telefone = campos.telefone.replace(/\D/g, '');
  if (telefone && telefone.length < 10) erros.telefone = 'Telefone deve ter 10 ou 11 dígitos';
  if (campos.cep.replace(/\D/g, '').length !== 8) erros.cep = 'Informe os 8 dígitos do CEP';
  if (!campos.logradouro.trim()) erros.logradouro = 'Consulte o CEP para preencher o endereço';
  if (!campos.numero.trim()) erros.numero = 'Informe o número do endereço';
  if (!campos.bairro.trim()) erros.bairro = 'Informe o bairro';
  if (!campos.cidade.trim()) erros.cidade = 'Informe a cidade';
  if (!/^[A-Z]{2}$/.test(campos.uf.trim().toUpperCase())) erros.uf = 'Informe a sigla do estado';
  return erros;
}
