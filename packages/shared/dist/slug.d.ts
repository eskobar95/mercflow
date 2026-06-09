type SlugStrategy = "nordic" | "omit";
/**
 * Pure slug utility for MercFlow SEO (S002 / J001).
 * Nordic: ø→oe, æ→ae, å→aa. Omit: ø→o, æ→a, å→a.
 */
declare function slugifyForStrategy(title: string, strategy: SlugStrategy): string;

export { type SlugStrategy, slugifyForStrategy };
