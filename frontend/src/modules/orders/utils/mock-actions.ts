/** Mock dışa aktarma — gerçek backend bağlantısı yok */
export function mockExportExcel(selectedCount: number, totalCount: number) {
  window.alert(
    `Excel dışa aktarma (mock)\n\n${
      selectedCount > 0
        ? `${selectedCount} seçili sipariş`
        : `${totalCount} sipariş`
    } dışa aktarılacak.\n\nBackend entegrasyonu sonraki aşamada eklenecek.`,
  )
}

export function mockExportPdf(selectedCount: number, totalCount: number) {
  window.alert(
    `PDF dışa aktarma (mock)\n\n${
      selectedCount > 0
        ? `${selectedCount} seçili sipariş`
        : `${totalCount} sipariş`
    } PDF olarak hazırlanacak.\n\nBackend entegrasyonu sonraki aşamada eklenecek.`,
  )
}

export function mockDeleteOrders(orderNos: string[]) {
  window.alert(
    `Silme işlemi (mock)\n\n${orderNos.length} sipariş silinecek:\n${orderNos.slice(0, 5).join('\n')}${
      orderNos.length > 5 ? `\n... ve ${orderNos.length - 5} sipariş daha` : ''
    }\n\nGerçek silme backend bağlantısı sonraki aşamada eklenecek.`,
  )
}
