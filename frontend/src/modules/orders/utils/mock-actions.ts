/** Mock dışa aktarma — gerçek backend bağlantısı yok */
export function mockDeleteOrders(orderNos: string[]) {
  window.alert(
    `Silme işlemi (mock)\n\n${orderNos.length} sipariş silinecek:\n${orderNos.slice(0, 5).join('\n')}${
      orderNos.length > 5 ? `\n... ve ${orderNos.length - 5} sipariş daha` : ''
    }\n\nGerçek silme backend bağlantısı sonraki aşamada eklenecek.`,
  )
}
