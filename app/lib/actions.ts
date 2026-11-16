'use server';

import { z } from 'zod';
import { db } from './db';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

const createInvoice = async (formData: FormData) => {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    const id = randomUUID();

    db.prepare(
        `
    INSERT INTO invoices (id, customer_id, amount, status, date)
    VALUES (?, ?, ?, ?, ?)
  `
    ).run(id, customerId, amountInCents, status, date);

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// ...

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    db.prepare(`
    UPDATE invoices
    SET customer_id = ?, amount = ?, status = ?
    WHERE id = ?
  `).run(customerId, amountInCents, status, id);

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    if (id == null) { throw new Error('Invoice ID is required'); }

    try {
        db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
        revalidatePath('/dashboard/invoices');
    }
    catch (error) {
        // We'll also log the error to the console for now
        console.error(error);
        return {
            message: 'Database Error: Failed to Delete Invoice. 1 1 1 ',
        };
    }

}

export default createInvoice;