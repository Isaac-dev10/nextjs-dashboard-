import { db } from '@/app/lib/db';
import * as Data from '@/app/lib/data';
async function listInvoices() {
  const data = db.prepare(`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666
  `).all();

  return data;
}

export async function GET() {
  // return Response.json({
  //   message:
  //     'Uncomment this file and remove this line. You can delete this file when you are finished.',
  // });
  try {
    return Response.json(await Data.fetchLatestInvoices());
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
