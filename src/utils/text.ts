/** Chuẩn hoá chuỗi tiếng Việt: bỏ dấu, lowercase, gộp khoảng trắng */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Tìm kiếm không phân biệt hoa/thường và dấu tiếng Việt */
export function matchesSearch(haystack: string, needle: string): boolean {
  const term = normalizeText(needle);
  if (!term) return true;
  return normalizeText(haystack).includes(term);
}

export function matchesAllTerms(haystack: string, needle: string): boolean {
  const terms = normalizeText(needle).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const target = normalizeText(haystack);
  return terms.every((term) => target.includes(term));
}
