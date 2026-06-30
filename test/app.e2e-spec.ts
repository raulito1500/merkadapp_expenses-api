import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ExpenseResponse {
  _id: string;
  description: string;
  amount: number;
  currency: string;
  owner: string;
}

describe('Expenses (e2e)', () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    const connection = app.get<Connection>(getConnectionToken());
    await connection.collection('expenses').deleteMany({});
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  const validExpense = {
    description: 'Team dinner',
    merchant: 'El Cielo',
    amount: 85000,
    currency: 'COP',
    date: '2026-06-30',
    owner: 'Raul',
  };

  it('POST /expenses creates a new expense', async () => {
    const response = await request(app.getHttpServer())
      .post('/expenses')
      .send(validExpense)
      .expect(201);

    const body = response.body as ExpenseResponse;
    expect(body).toMatchObject({
      description: validExpense.description,
      amount: validExpense.amount,
      currency: validExpense.currency,
      owner: validExpense.owner,
    });
    expect(body._id).toBeDefined();
  });

  it('GET /expenses returns the list of created expenses', async () => {
    await request(app.getHttpServer())
      .post('/expenses')
      .send(validExpense)
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/expenses')
      .expect(200);

    const body = response.body as ExpenseResponse[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      description: validExpense.description,
    });
  });

  it('POST /expenses rejects an invalid payload', async () => {
    const withoutAmount: Record<string, unknown> = { ...validExpense };
    delete withoutAmount.amount;

    await request(app.getHttpServer())
      .post('/expenses')
      .send(withoutAmount)
      .expect(400);
  });
});
