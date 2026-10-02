interface ArticleRelationIdentity {
  id: string;
  articleId: string;
}

/** Unambiguous, repeatable identity for a new item or an incoming legacy collision. */
export function scopedArticleRelationId(articleId: string, itemId: string): string {
  return `cms_${JSON.stringify([articleId, itemId])}`;
}

export function resolveArticleRelationIds<T extends ArticleRelationIdentity>(
  articleId: string,
  incoming: T[],
  occupied: ArticleRelationIdentity[],
): T[] {
  const owners = new Map(occupied.map(item => [item.id, item.articleId]));
  const resolvedIds = new Set<string>();

  return incoming.map(item => {
    if (item.articleId !== articleId) throw new Error('ERR_CMS_RELATED_OWNER_MISMATCH');
    const id = owners.get(item.id) === articleId
      ? item.id
      : scopedArticleRelationId(articleId, item.id);
    const resolvedOwner = owners.get(id);
    if ((resolvedOwner !== undefined && resolvedOwner !== articleId) || resolvedIds.has(id)) {
      throw new Error('ERR_CMS_RELATED_ID_CONFLICT');
    }
    resolvedIds.add(id);
    return { ...item, id };
  });
}
