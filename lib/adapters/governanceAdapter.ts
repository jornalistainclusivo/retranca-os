import { DbGovernanceDoc } from '@/db/schema';
import { GovernanceDoc } from '@/types/editorial';

export const toGovernanceDocProps = (dbDoc: DbGovernanceDoc): GovernanceDoc => {
  return {
    id: dbDoc.id,
    type: dbDoc.type,
    title: dbDoc.title,
    description: dbDoc.description || '',
    lastUpdated: dbDoc.lastUpdated,
    content: dbDoc.content,
  };
};

export const fromGovernanceDocProps = (doc: GovernanceDoc): DbGovernanceDoc => {
  return {
    id: doc.id,
    type: doc.type,
    title: doc.title,
    description: doc.description,
    lastUpdated: doc.lastUpdated,
    content: doc.content,
  };
};
