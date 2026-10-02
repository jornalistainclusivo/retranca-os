import { describe, expect, it } from 'vitest';
import { resolveArticleRelationIds, scopedArticleRelationId } from '../articleRelationIds';

describe('CMS related-row ownership and retry identities', () => {
  it('keeps existing article-owned IDs and payloads without rewriting history identity', () => {
    const incoming = [{ id: 'native-history-id', articleId: 'a', action: 'Native transition' }];
    expect(resolveArticleRelationIds('a', incoming, [{ id: 'native-history-id', articleId: 'a' }]))
      .toEqual(incoming);
  });

  it('gives two unsaved articles independent child IDs even when their legacy inputs match', () => {
    const first = resolveArticleRelationIds('a', [{ id: 'c1', articleId: 'a', completed: 1 }], []);
    const second = resolveArticleRelationIds('b', [{ id: 'c1', articleId: 'b', completed: 0 }], []);
    expect(first[0].id).not.toBe(second[0].id);
    expect(first[0].completed).toBe(1);
    expect(second[0].completed).toBe(0);
  });

  it('repairs a legacy collision without mutating the owning article or input draft', () => {
    const occupied = [{ id: 'c1', articleId: 'a' }];
    const incoming = [{ id: 'c1', articleId: 'b', label: 'Research', completed: 0 }];
    const result = resolveArticleRelationIds('b', incoming, occupied);
    expect(result[0]).toEqual({ ...incoming[0], id: scopedArticleRelationId('b', 'c1') });
    expect(occupied).toEqual([{ id: 'c1', articleId: 'a' }]);
    expect(incoming[0].id).toBe('c1');
  });

  it('reuses the same scoped identity on retry after a partial save and after reopening', () => {
    const incoming = [{ id: 'h1', articleId: 'b', action: 'Created' }];
    const first = resolveArticleRelationIds('b', incoming, [{ id: 'h1', articleId: 'a' }]);
    const occupied = [{ id: 'h1', articleId: 'a' }, first[0]];
    expect(resolveArticleRelationIds('b', incoming, occupied)).toEqual(first);
    expect(resolveArticleRelationIds('b', first, occupied)).toEqual(first);
  });

  it('does not confuse article/item pairs containing separators or reserved property names', () => {
    expect(scopedArticleRelationId('a_b', 'c')).not.toBe(scopedArticleRelationId('a', 'b_c'));
    expect(resolveArticleRelationIds('__proto__', [{ id: 'constructor', articleId: '__proto__' }], []))
      .toHaveLength(1);
  });

  it('rejects a scoped ID owned by another article, duplicate inputs and wrong owners', () => {
    const incoming = [{ id: 'c1', articleId: 'b' }];
    expect(() => resolveArticleRelationIds('b', incoming, [
      { id: scopedArticleRelationId('b', 'c1'), articleId: 'a' },
    ])).toThrow('ERR_CMS_RELATED_ID_CONFLICT');
    expect(() => resolveArticleRelationIds('b', [...incoming, ...incoming], []))
      .toThrow('ERR_CMS_RELATED_ID_CONFLICT');
    expect(() => resolveArticleRelationIds('a', incoming, []))
      .toThrow('ERR_CMS_RELATED_OWNER_MISMATCH');
  });
});
