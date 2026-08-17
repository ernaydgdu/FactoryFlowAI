/**
 * Türkçe metin normalizasyonu, tokenizasyon ve yazım hatası toleranslı
 * (Levenshtein tabanlı) kelime eşleştirme yardımcıları.
 *
 * Sohbet asistanı intent eşleştirmesi ve bilgi kütüphanesi aramasında
 * ortak olarak kullanılır.
 */

export function normalizeTr(text: string): string {
  return text.toLocaleLowerCase('tr-TR');
}

export function tokenize(text: string): string[] {
  return normalizeTr(text)
    .split(/[^a-zçğıöşü0-9]+/)
    .filter((word) => word.length > 0);
}

// Klasik Wagner-Fischer düzenleme mesafesi (ekleme/silme/değiştirme).
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previousRow = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow.push(
        Math.min(
          currentRow[j - 1] + 1, // ekleme
          previousRow[j] + 1, // silme
          previousRow[j - 1] + cost, // değiştirme
        ),
      );
    }
    previousRow = currentRow;
  }

  return previousRow[b.length];
}

// Yazım hatası toleransı yalnızca 4+ karakterli kelimelerde uygulanır —
// kısa kelimelerde (ör. "top", "kaç") yanlış pozitif riski çok yüksektir.
// 4-6 karakter için 1, 7+ karakter için 2 karakterlik fark tolere edilir.
function fuzzyThreshold(word: string): number {
  if (word.length < 4) return 0;
  return word.length <= 6 ? 1 : 2;
}

/** İki kelimenin aynı şeyi kastettiğini (tam eşleşme ya da küçük yazım
 * farkıyla) kontrol eder. Eşik `keyword`in uzunluğuna göre belirlenir. */
export function wordsMatch(word: string, keyword: string): boolean {
  if (word === keyword) return true;
  const threshold = fuzzyThreshold(keyword);
  if (threshold === 0) return false;
  if (Math.abs(word.length - keyword.length) > threshold) return false;
  return levenshteinDistance(word, keyword) <= threshold;
}

/**
 * Bir anahtar kelime/ifadenin soruda geçip geçmediğini kontrol eder.
 * Önce doğrudan alt-dize eşleşmesi denenir (Türkçe ek almış hâlleri de
 * ekstra kod yazmadan yakalar: "durum" ~ "durumda"). Bulunamazsa —
 * yalnızca o zaman — yazım hatası toleranslı kelime bazlı eşleştirmeye
 * geçilir (çok kelimeli ifadelerde her kelime ayrı ayrı aranır).
 */
export function keywordPresent(
  normalizedQuestion: string,
  tokens: string[],
  keyword: string,
): boolean {
  const normalizedKeyword = normalizeTr(keyword);
  if (normalizedQuestion.includes(normalizedKeyword)) return true;

  const keywordWords = normalizedKeyword.split(' ').filter(Boolean);
  return keywordWords.every((kw) => tokens.some((t) => wordsMatch(t, kw)));
}
