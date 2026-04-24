/**
 * Flattens nested string leaf objects into key paths joined by kebab segments.
 * `default` keys collapse so `group.primary.default` becomes `group-primary` (not `group-primary-default`).
 */
export declare function flattenStringTree(value: unknown, segments: string[]): Array<[string, string]>;
export declare function flattenRootStringTree(root: Record<string, unknown>): Array<[string, string]>;
//# sourceMappingURL=flattenTree.d.ts.map