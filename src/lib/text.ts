const COMBINING_MARKS_REGEX = /[̀-ͯ]/g;
const CYRILLIC_REGEX = /[Ѐ-џ]/g;

// Serbian Cyrillic → Latin, one-to-one (digraphs for љ/њ/џ), so a city stored
// as "Панчево" or "Београд" is still found when the user types in Latin.
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z', и: 'i',
  ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š',
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Ђ: 'Đ', Е: 'E', Ж: 'Ž', З: 'Z', И: 'I',
  Ј: 'J', К: 'K', Л: 'L', Љ: 'Lj', М: 'M', Н: 'N', Њ: 'Nj', О: 'O', П: 'P', Р: 'R',
  С: 'S', Т: 'T', Ћ: 'Ć', У: 'U', Ф: 'F', Х: 'H', Ц: 'C', Ч: 'Č', Џ: 'Dž', Ш: 'Š',
};

function cyrillicToLatin(value: string): string {
  return value.replace(CYRILLIC_REGEX, (ch) => CYRILLIC_TO_LATIN[ch] ?? ch);
}

/**
 * Normalizes text for fuzzy matching regardless of script or diacritics:
 * transliterates Cyrillic to Latin, then lowercases and strips accents
 * (č/ć/š/ž) and expands đ/Đ to dj/Dj ("ošišana latinica"), so typing "Panc"
 * matches "Pančevo"/"Панчево" and "B" matches "Beograd"/"Београд".
 */
export function normalizeForSearch(value: string): string {
  return cyrillicToLatin(value)
    .replace(/đ/g, 'dj')
    .replace(/Đ/g, 'Dj')
    .normalize('NFD')
    .replace(COMBINING_MARKS_REGEX, '')
    .toLowerCase()
    .trim();
}
