export type EnderecoViaCep = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  complemento: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

export function apenasDigitosCep(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 8);
}

export function formatarCep(valor: string): string {
  const cep = apenasDigitosCep(valor);
  return cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

export async function buscarEnderecoPorCep(valor: string): Promise<EnderecoViaCep> {
  const cep = apenasDigitosCep(valor);
  if (cep.length !== 8) {
    throw new Error('Informe os 8 dígitos do CEP.');
  }

  let resposta: Response;
  try {
    resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  } catch {
    throw new Error('Não foi possível consultar o CEP. Verifique sua conexão e tente novamente.');
  }

  if (!resposta.ok) {
    throw new Error('Não foi possível consultar o CEP. Tente novamente em instantes.');
  }

  const dados = (await resposta.json()) as ViaCepResponse;
  if (dados.erro) {
    throw new Error('CEP não encontrado. Confira os números informados.');
  }

  return {
    cep,
    logradouro: dados.logradouro?.trim() ?? '',
    bairro: dados.bairro?.trim() ?? '',
    cidade: dados.localidade?.trim() ?? '',
    uf: dados.uf?.trim().toUpperCase() ?? '',
    complemento: dados.complemento?.trim() ?? '',
  };
}
