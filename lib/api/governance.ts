import { getDb } from '@/db/client';
import { governanceDocs, DbGovernanceDoc } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const getGovernanceDocs = async (): Promise<DbGovernanceDoc[]> => {
  const db = await getDb();
  return await db.select().from(governanceDocs);
};

export const getGovernanceDocById = async (id: string): Promise<DbGovernanceDoc | undefined> => {
  const db = await getDb();
  const results = await db.select().from(governanceDocs).where(eq(governanceDocs.id, id));
  return results[0];
};

export const createGovernanceDoc = async (doc: DbGovernanceDoc): Promise<void> => {
  const db = await getDb();
  await db.insert(governanceDocs).values(doc);
};

export const updateGovernanceDoc = async (id: string, doc: Partial<DbGovernanceDoc>): Promise<void> => {
  const db = await getDb();
  await db.update(governanceDocs).set(doc).where(eq(governanceDocs.id, id));
};

export const deleteGovernanceDoc = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(governanceDocs).where(eq(governanceDocs.id, id));
};
