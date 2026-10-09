import { filtrarSlotsDoEvento, proximosDias, rotuloDia } from '../reagendamento';
import type { SlotClinica } from '../../services/clinicaService';

const slot = (tipo: SlotClinica['tipoProfissional'], id: number, hora: string): SlotClinica => ({
  idServico: 5, tipoProfissional: tipo, idProfissional: id, nomeProfissional: `P${id}`, hora,
});

describe('reagendamento', () => {
  const slots = [slot('VETERINARIO', 9, '09:00'), slot('VETERINARIO', 9, '10:00'), slot('VETERINARIO', 3, '09:00'), slot('ESTETICA', 9, '09:00')];

  it('mantém só os horários do veterinário do evento', () => {
    const r = filtrarSlotsDoEvento(slots, { idVeterinario: '9', data: '2026-10-12', hora: '08:00' }, '2026-10-13');
    expect(r.map(s => s.hora)).toEqual(['09:00', '10:00']);
    expect(r.every(s => s.tipoProfissional === 'VETERINARIO' && s.idProfissional === 9)).toBe(true);
  });

  it('mantém só os horários do profissional de estética do evento', () => {
    const r = filtrarSlotsDoEvento(slots, { idVeterinario: '', idProfissionalEstetica: 9, data: '2026-10-12' }, '2026-10-13');
    expect(r).toEqual([slots[3]]);
  });

  it('não oferece o horário que o tutor já tem', () => {
    const r = filtrarSlotsDoEvento(slots, { idVeterinario: '9', data: '2026-10-12', hora: '09:00' }, '2026-10-12');
    expect(r.map(s => s.hora)).toEqual(['10:00']);
  });

  it('mostra todos quando o evento não identifica o profissional', () => {
    expect(filtrarSlotsDoEvento(slots, { idVeterinario: '', data: '2026-10-12' }, '2026-10-13')).toHaveLength(4);
  });

  it('gera os próximos dias em ordem, a partir de hoje', () => {
    expect(proximosDias(3, new Date(2026, 9, 30))).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
  });

  it('rotula o dia com dia da semana e dd/mm', () => {
    expect(rotuloDia('2026-10-12')).toMatch(/12\/10$/);
  });
});