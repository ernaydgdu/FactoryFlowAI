import {
  keywordPresent,
  normalizeTr,
  tokenize,
} from '../common/text-match.util';

/**
 * Bir "klozun" eşleşmesi için AND ile bağlanan kelime grupları; her grup
 * kendi içinde OR ile bağlanan eş anlamlı/varyant ifadelerden oluşur.
 * Bir intent birden fazla kloz içerebilir (kloz'lar birbirine OR ile
 * bağlıdır) — böylece orijinal `(a && b) || c` gibi boolean ifadeler
 * doğal biçimde temsil edilebilir.
 */
export type IntentClause = string[][];

export type IntentDefinition = {
  id: string;
  label: string;
  clauses: IntentClause[];
  /** Anahtar kelime eşleşmesine ek, isteğe bağlı sert koşul (ör. soruda
   * sipariş numarası geçmesi zorunluluğu). */
  gate?: (question: string) => boolean;
};

export type IntentMatchResult = {
  intentId: string | null;
  /** Birden fazla intent güçlü (2+ grup) ve eşit skorla eşleşirse
   * kullanıcıya sorulacak netleştirme metni. */
  clarification: string | null;
};

/**
 * Bir intent'in soruyla ne kadar örtüştüğünü puanlar. Puan, tam olarak
 * eşleşen (tüm grupları eşleşen) klozlardan en yüksek grup sayısına
 * sahip olanıdır — yani "kaç anahtar kelime/eş anlamlı eşleşti".
 * Hiçbir kloz tam eşleşmezse (ya da `gate` başarısız olursa) skor 0'dır.
 */
export function scoreIntent(
  question: string,
  intent: IntentDefinition,
): number {
  if (intent.gate && !intent.gate(question)) return 0;

  const normalizedQuestion = normalizeTr(question);
  const tokens = tokenize(question);

  let best = 0;
  for (const clause of intent.clauses) {
    const allGroupsMatched = clause.every((group) =>
      group.some((synonym) =>
        keywordPresent(normalizedQuestion, tokens, synonym),
      ),
    );
    if (allGroupsMatched) {
      best = Math.max(best, clause.length);
    }
  }
  return best;
}

// İki veya daha fazla intent yüksek-güvenli (2+ anahtar kelime grubu
// eşleşen) bir çakışmaya girerse kullanıcıya netleştirme sorusu sorulur.
// Tek anahtar kelimeli (skor 1) çakışmalar çok sık olduğundan (ör. "termin
// durumu" hem "termin" hem "durum" içerir) bunlar sessizce, tanım sırasına
// göre (orijinal öncelik sırası) çözülür — kullanıcıyı gereksiz yere
// netleştirme sorusuyla yormamak için.
const CLARIFICATION_MIN_SCORE = 2;

export function pickBestIntent(
  question: string,
  candidates: IntentDefinition[],
): IntentMatchResult {
  const scored = candidates
    .map((intent, index) => ({
      id: intent.id,
      label: intent.label,
      score: scoreIntent(question, intent),
      index,
    }))
    .filter((s) => s.score > 0);

  if (scored.length === 0) {
    return { intentId: null, clarification: null };
  }

  const topScore = Math.max(...scored.map((s) => s.score));
  const top = scored.filter((s) => s.score === topScore);

  if (top.length === 1 || topScore < CLARIFICATION_MIN_SCORE) {
    const winner = [...top].sort((a, b) => a.index - b.index)[0];
    return { intentId: winner.id, clarification: null };
  }

  const options = top.map((s) => s.label).join(' yoksa ');
  return {
    intentId: null,
    clarification: `Bunu mu demek istediniz: ${options}? Sorunuzu biraz daha netleştirir misiniz?`,
  };
}
