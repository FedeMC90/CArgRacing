import request from 'supertest';
import app from '../../app';
import * as garageService from '../../services/garage.service';
import { signToken } from '../../utils/jwt';

jest.mock('../../services/garage.service');

const mockGetGarage = garageService.getGarage as jest.Mock;
const mockUpdateCarColor = garageService.updateCarColor as jest.Mock;

const fakeToken = signToken({ userId: 'u1', email: 'a@b.com' });
const fakePlayer = {
  id: 'p1',
  apodo: 'Speedy',
  pesos: 1000,
  reputacion: 0,
  cochera_nivel: 1,
  autos: [],
};

beforeEach(() => jest.clearAllMocks());

describe('GET /api/garage', () => {
  it('returns 200 with garage data', async () => {
    mockGetGarage.mockResolvedValue(fakePlayer);

    const res = await request(app)
      .get('/api/garage')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.apodo).toBe('Speedy');
  });

  it('returns 401 when no auth token', async () => {
    const res = await request(app).get('/api/garage');
    expect(res.status).toBe(401);
  });

  it('returns 404 when service throws', async () => {
    mockGetGarage.mockRejectedValue(new Error('Jugador no encontrado'));

    const res = await request(app)
      .get('/api/garage')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Jugador no encontrado');
  });
});

describe('PATCH /api/garage/car/:playerCarId/color', () => {
  it('returns 200 with updated car', async () => {
    mockUpdateCarColor.mockResolvedValue({ id: 'pc1', color_hex: '#FF0000' });

    const res = await request(app)
      .patch('/api/garage/car/pc1/color')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({ colorHex: '#FF0000' });

    expect(res.status).toBe(200);
    expect(res.body.color_hex).toBe('#FF0000');
  });

  it('returns 400 when colorHex is missing', async () => {
    const res = await request(app)
      .patch('/api/garage/car/pc1/color')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 401 when no auth token', async () => {
    const res = await request(app)
      .patch('/api/garage/car/pc1/color')
      .send({ colorHex: '#FF0000' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when service throws', async () => {
    mockUpdateCarColor.mockRejectedValue(new Error('Color inválido. Usá formato hex #RRGGBB'));

    const res = await request(app)
      .patch('/api/garage/car/pc1/color')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({ colorHex: 'bad-color' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Color inválido. Usá formato hex #RRGGBB');
  });
});
