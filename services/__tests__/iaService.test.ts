import { apiRequest } from '../api/httpClient';
import { iaService } from '../iaService';
import type { Pet } from '../../types';

jest.mock('../api/httpClient', () => ({
  apiRequest: jest.fn(),
}));

const petLuna: Pet = {
  id: '12', nome: 'Luna', especie: 'cachorro', sexo: 'femea', raca: 'Vira-lata',
  dataNascimento: '2020-12-25T00:00:00', peso: '12.5',
};

describe('iaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envia a pergunta com o contexto do pet ativo e o histórico, usando a base da IA', async () => {
    (apiRequest as jest.Mock).mockResolvedValue({ mensagem: 'Olá! Como posso ajudar a Luna hoje?' });

    const historico = [{ role: 'user' as const, text: 'oi' }];
    const resposta = await iaService.perguntar('oi', petLuna, historico);

    expect(apiRequest).toHaveBeenCalledWith({
      method: 'POST',
      path: '/api/v1/ia/orquestrador/processar',
      body: {
        message: 'oi',
        contexto: {
          history: historico,
          pet_ativo: { id: '12', nome: 'Luna', especie: 'cachorro', raca: 'Vira-lata' },
        },
      },
      baseUrl: 'https://vetsync-ia.onrender.com',
      timeoutMs: 60_000,
    });
    expect(resposta).toEqual({ texto: 'Olá! Como posso ajudar a Luna hoje?' });
  });

  it('monta o contexto sem "pet_ativo" quando não há pet selecionado', async () => {
    (apiRequest as jest.Mock).mockResolvedValue({ mensagem: 'Olá!' });

    await iaService.perguntar('oi', null, []);

    expect(apiRequest).toHaveBeenCalledWith(expect.objectContaining({
      body: { message: 'oi', contexto: { history: [] } },
    }));
  });

  it('lança um erro quando a SIA responde sem mensagem', async () => {
    (apiRequest as jest.Mock).mockResolvedValue({});

    await expect(iaService.perguntar('oi', null, [])).rejects.toThrow(
      'A SIA respondeu sem uma mensagem para exibição.'
    );
  });
});
