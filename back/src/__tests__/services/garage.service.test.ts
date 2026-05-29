const mockQuery = jest.fn();

jest.mock('../../db', () => ({
  db: { query: mockQuery },
}));

import { getGarage, updateCarColor } from '../../services/garage.service';

function resetQuery(...responses: Array<{ rows: unknown[] }>) {
  let call = 0;
  mockQuery.mockImplementation(() => Promise.resolve(responses[call++] ?? { rows: [] }));
}

beforeEach(() => jest.clearAllMocks());

describe('getGarage', () => {
  it('returns player with autos', async () => {
    const fakePlayer = { id: 'p1', apodo: 'Speedy', pesos: 1000, reputacion: 0, cochera_nivel: 1, autos: [] };
    resetQuery({ rows: [fakePlayer] });

    const result = await getGarage('u1');
    expect(result.apodo).toBe('Speedy');
  });

  it('throws when player is not found', async () => {
    resetQuery({ rows: [] });
    await expect(getGarage('nobody')).rejects.toThrow('Jugador no encontrado');
  });
});

describe('updateCarColor', () => {
  it('returns updated car with new color', async () => {
    resetQuery(
      { rows: [{ id: 'pc1' }] },
      { rows: [{ id: 'pc1', color_hex: '#FF0000' }] },
    );

    const result = await updateCarColor('u1', 'pc1', '#FF0000');
    expect(result.color_hex).toBe('#FF0000');
  });

  it('throws when color format is invalid', async () => {
    await expect(updateCarColor('u1', 'pc1', 'red')).rejects.toThrow('Color inválido');
    await expect(updateCarColor('u1', 'pc1', '#GGGGGG')).rejects.toThrow('Color inválido');
  });

  it('throws when the car does not belong to the player', async () => {
    resetQuery({ rows: [] });
    await expect(updateCarColor('u1', 'pc-other', '#00FF00')).rejects.toThrow('Auto no encontrado');
  });
});
