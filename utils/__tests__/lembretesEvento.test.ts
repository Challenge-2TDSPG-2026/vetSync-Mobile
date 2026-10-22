import {
  LEMBRETES_PADRAO,
  OPCOES_LEMBRETE,
  calcularDisparoLembrete,
  corpoLembrete,
  dataHoraDoEvento,
  descreverAntecedencia,
  idLembrete,
  minutosDoIdLembrete,
  tituloLembrete,
} from '../lembretesEvento';

describe('lembretesEvento', () => {
  it('oferece 24 horas e 30 minutos antes, ambos marcados por padrão', () => {
    expect(OPCOES_LEMBRETE.map((o) => o.minutos)).toEqual([1440, 30]);
    expect(LEMBRETES_PADRAO).toEqual([1440, 30]);
  });

  describe('dataHoraDoEvento', () => {
    it('combina a data (YYYY-MM-DD) com a hora do evento', () => {
      const data = dataHoraDoEvento({ data: '2026-10-23', hora: '14:30' });
      expect(data.getFullYear()).toBe(2026);
      expect(data.getMonth()).toBe(9);
      expect(data.getDate()).toBe(23);
      expect(data.getHours()).toBe(14);
      expect(data.getMinutes()).toBe(30);
    });

    it('aceita hora com segundos (HH:mm:ss)', () => {
      const data = dataHoraDoEvento({ data: '2026-10-23', hora: '09:05:00' });
      expect(data.getHours()).toBe(9);
      expect(data.getMinutes()).toBe(5);
    });

    it('usa a data completa quando ela já traz o horário', () => {
      const iso = '2026-10-23T16:45:00';
      expect(dataHoraDoEvento({ data: iso }).getTime()).toBe(new Date(iso).getTime());
    });

    it('cai no padrão do app (meio-dia) quando não há hora', () => {
      expect(dataHoraDoEvento({ data: '2026-10-23' }).getHours()).toBe(12);
    });

    it('ignora hora em formato inválido', () => {
      expect(dataHoraDoEvento({ data: '2026-10-23', hora: 'abc' }).getHours()).toBe(12);
    });
  });

  describe('calcularDisparoLembrete', () => {
    const evento = { data: '2026-10-23', hora: '14:30' };
    const inicio = new Date('2026-10-23T14:30:00').getTime();

    it('dispara exatamente 24 horas antes', () => {
      expect(calcularDisparoLembrete(evento, 1440).getTime()).toBe(inicio - 24 * 60 * 60_000);
    });

    it('dispara exatamente 30 minutos antes', () => {
      expect(calcularDisparoLembrete(evento, 30).getTime()).toBe(inicio - 30 * 60_000);
    });
  });

  describe('textos', () => {
    it('descreve a antecedência', () => {
      expect(descreverAntecedencia(30)).toBe('30 minutos');
      expect(descreverAntecedencia(60)).toBe('1 hora');
      expect(descreverAntecedencia(120)).toBe('2 horas');
      expect(descreverAntecedencia(2880)).toBe('2 dias');
    });

    it('título dos avisos padrão', () => {
      expect(tituloLembrete(1440)).toBe('Evento em 24 horas');
      expect(tituloLembrete(30)).toBe('Evento em 30 minutos');
    });

    it('corpo com tipo, pet e hora', () => {
      expect(corpoLembrete({ nomeTipoEvento: 'Vacina V10', hora: '14:30:00' }, 'Luna')).toBe(
        'Vacina V10 — Luna às 14:30',
      );
    });

    it('corpo sem pet nem hora', () => {
      expect(corpoLembrete({ nomeTipoEvento: 'Banho' })).toBe('Banho');
    });
  });

  describe('id do lembrete', () => {
    it('guarda e recupera a antecedência', () => {
      const id = idLembrete('42', 30);
      expect(id).toBe('evento-42-lembrete-30');
      expect(minutosDoIdLembrete(id)).toBe(30);
      expect(minutosDoIdLembrete(idLembrete('42', 1440))).toBe(1440);
    });

    it('devolve null para ids antigos (ex.: UUID)', () => {
      expect(minutosDoIdLembrete('8f14e45f-ceea-467a-9575-1c0f9f0b2d3a')).toBeNull();
    });
  });
});
