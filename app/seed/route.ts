
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { db } from '@/app/lib/db';
import {
  invoices,
  customers,
  revenue,
  users,
} from '../lib/placeholder-data';

export const runtime = 'nodejs';

function createStableId(value: string) {
  const hex = createHash('sha256')
    .update(value)
    .digest('hex')
    .slice(0, 32);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      image_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (customer_id)
        REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS revenue (
      month TEXT NOT NULL UNIQUE,
      revenue INTEGER NOT NULL
    );
  `);
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json(
      { error: 'Seeding is only allowed in development.' },
      { status: 403 }
    );
  }

  try {
    createTables();

    // Hash passwords before starting the synchronous transaction.
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      }))
    );

    const seedTransaction = db.transaction(() => {
      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users
          (id, name, email, password)
        VALUES
          (@id, @name, @email, @password)
      `);

      for (const user of hashedUsers) {
        insertUser.run(user);
      }

      const insertCustomer = db.prepare(`
        INSERT OR IGNORE INTO customers
          (id, name, email, image_url)
        VALUES
          (@id, @name, @email, @image_url)
      `);

      for (const customer of customers) {
        insertCustomer.run(customer);
      }

      const insertInvoice = db.prepare(`
        INSERT OR IGNORE INTO invoices
          (id, customer_id, amount, status, date)
        VALUES
          (@id, @customer_id, @amount, @status, @date)
      `);

      for (const invoice of invoices) {
        const date = (invoice.date as unknown) instanceof Date
          ? (invoice.date as unknown as Date).toISOString().slice(0, 10)
          : String(invoice.date).slice(0, 10);

        const id = createStableId(
          `${invoice.customer_id}|${invoice.amount}|${invoice.status}|${date}`
        );

        insertInvoice.run({
          id,
          customer_id: invoice.customer_id,
          amount: invoice.amount,
          status: invoice.status,
          date,
        });
      }

      const insertRevenue = db.prepare(`
        INSERT OR IGNORE INTO revenue (month, revenue)
        VALUES (@month, @revenue)
      `);

      for (const item of revenue) {
        insertRevenue.run(item);
      }
    });

    seedTransaction();

    return Response.json({
      message: 'Database seeded successfully',
    });
  } catch (error) {
    console.error('Database seeding failed:', error);

    return Response.json(
      { error: 'Database seeding failed' },
      { status: 500 }
    );
  }
}
