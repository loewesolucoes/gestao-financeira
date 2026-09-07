// Conservative allowlist/regex-based guard for model-generated SQL. Not a full SQL parser —
// sufficient because the only caller is a same-origin, single-user, client-side tool loop.

export const ALLOWED_TABLES = ['transacoes', 'patrimonio', 'metas', 'notas', 'categoria_transacoes'];

const FORBIDDEN_KEYWORDS = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'ATTACH', 'DETACH',
  'PRAGMA', 'VACUUM', 'REPLACE', 'CREATE', 'TRIGGER', 'GRANT', 'REVOKE',
];

export class SqlQueryGuardError extends Error { }

export function sanitizeReadOnlyQuery(sql: string): string {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new SqlQueryGuardError('A consulta SQL não pode ser vazia.');
  }

  const trimmed = sql.trim();
  const withoutTrailingSemicolon = trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;

  if (withoutTrailingSemicolon.includes(';')) {
    throw new SqlQueryGuardError('Apenas uma única instrução SQL é permitida por consulta.');
  }

  if (!/^(select|with)\b/i.test(withoutTrailingSemicolon)) {
    throw new SqlQueryGuardError('Apenas consultas SELECT/WITH somente leitura são permitidas.');
  }

  const keywordRegex = new RegExp(`\\b(${FORBIDDEN_KEYWORDS.join('|')})\\b`, 'i');
  const forbiddenMatch = withoutTrailingSemicolon.match(keywordRegex);

  if (forbiddenMatch) {
    throw new SqlQueryGuardError(`A palavra-chave "${forbiddenMatch[0]}" não é permitida em consultas somente leitura.`);
  }

  const cteNames = extractCteNames(withoutTrailingSemicolon);
  const referencedTables = extractReferencedTables(withoutTrailingSemicolon).filter(table => !cteNames.includes(table));
  const disallowedTable = referencedTables.find(table => !ALLOWED_TABLES.includes(table));

  if (disallowedTable != null) {
    throw new SqlQueryGuardError(`A tabela "${disallowedTable}" não pode ser consultada. Tabelas permitidas: ${ALLOWED_TABLES.join(', ')}.`);
  }

  const hasLimit = /\blimit\b/i.test(withoutTrailingSemicolon);

  return hasLimit ? withoutTrailingSemicolon : `${withoutTrailingSemicolon} LIMIT 200`;
}

// CTE (WITH clause) aliases are not real tables and should not be checked against the allowlist.
function extractCteNames(sql: string): string[] {
  if (!/^with\b/i.test(sql)) {
    return [];
  }

  const names: string[] = [];
  const regex = /(?:\bwith\s+|,\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s+as\s*\(/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sql)) !== null) {
    names.push(match[1].toLowerCase());
  }

  return names;
}

function extractReferencedTables(sql: string): string[] {
  const tables: string[] = [];
  const regex = /\b(?:from|join)\s+["'`]?([a-zA-Z_][a-zA-Z0-9_]*)["'`]?/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sql)) !== null) {
    tables.push(match[1].toLowerCase());
  }

  return tables;
}
