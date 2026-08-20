export type FasonFireStats = {
  fireQuantity: number | null;
  fireRate: number | null;
};

// Fason gönderiminde giden/dönen adet farkından fire miktarı ve oranını
// hesaplar. Dönüş henüz yapılmadıysa (receivedQuantity null) ikisi de null
// döner; dönen miktar gönderilenden fazla olsa bile fire negatife düşmez.
export function computeFasonFireStats(
  sentQuantity: number,
  receivedQuantity: number | null,
): FasonFireStats {
  if (receivedQuantity == null) {
    return { fireQuantity: null, fireRate: null };
  }

  const fireQuantity = Math.max(0, sentQuantity - receivedQuantity);
  const fireRate =
    sentQuantity > 0 ? (fireQuantity / sentQuantity) * 100 : null;

  return { fireQuantity, fireRate };
}
