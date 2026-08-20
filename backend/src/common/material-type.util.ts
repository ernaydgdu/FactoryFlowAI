// Malzeme tipinin kumaş olup olmadığını kontrol eder. Hem OrderBOMItem'ın
// sabit enum değerini ("KUMAS") hem Material'ın serbest metin alanını
// ("Kumaş") tek bir yerden, tutarlı biçimde eşleştirmek için kullanılır.
export function isFabricMaterialType(materialType: string): boolean {
  const normalized = materialType.toLocaleLowerCase('tr-TR');
  return normalized === 'kumas' || normalized === 'kumaş';
}
