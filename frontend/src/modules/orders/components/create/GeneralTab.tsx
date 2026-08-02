import { FormField, FormGrid, selectClass } from '@/components/erp/form-field'
import { Input } from '@/components/ui/input'
import {
  BRANDS,
  BUYERS,
  COLLECTIONS,
  CURRENCIES,
  CUSTOMERS,
  DELIVERY_TERMS,
  FACTORIES,
  MANUFACTURERS,
  MERCHANDISERS,
  PAYMENT_TERMS,
  SEASONS,
} from '@/modules/core/data/master-data'

import type { UseOrderCreateReturn } from '../../hooks/use-order-create'

type TabProps = {
  form: UseOrderCreateReturn
}

export function GeneralTab({ form: orderForm }: TabProps) {
  const g = orderForm.form.general
  const { updateGeneral } = orderForm

  return (
    <FormGrid cols={3}>
      <FormField label="Müşteri" id="customer" required>
        <select
          id="customer"
          value={g.customer}
          onChange={(e) => updateGeneral('customer', e.target.value)}
          className={selectClass}
        >
          <option value="">Seçiniz</option>
          {CUSTOMERS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Marka" id="brand">
        <select
          id="brand"
          value={g.brand}
          onChange={(e) => updateGeneral('brand', e.target.value)}
          className={selectClass}
        >
          <option value="">Seçiniz</option>
          {BRANDS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Buyer" id="buyer">
        <select
          id="buyer"
          value={g.buyer}
          onChange={(e) => updateGeneral('buyer', e.target.value)}
          className={selectClass}
        >
          <option value="">Seçiniz</option>
          {BUYERS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Merchandiser" id="merchandiser">
        <select
          id="merchandiser"
          value={g.merchandiser}
          onChange={(e) => updateGeneral('merchandiser', e.target.value)}
          className={selectClass}
        >
          <option value="">Seçiniz</option>
          {MERCHANDISERS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </FormField>
      <FormField label="PO No" id="poNo">
        <Input
          id="poNo"
          value={g.poNo}
          onChange={(e) => updateGeneral('poNo', e.target.value)}
          placeholder="Müşteri PO numarası"
        />
      </FormField>
      <FormField label="PO Tarihi" id="poDate">
        <Input
          id="poDate"
          type="date"
          value={g.poDate}
          onChange={(e) => updateGeneral('poDate', e.target.value)}
        />
      </FormField>
      <FormField label="Sipariş Tarihi" id="orderDate">
        <Input
          id="orderDate"
          type="date"
          value={g.orderDate}
          onChange={(e) => updateGeneral('orderDate', e.target.value)}
        />
      </FormField>
      <FormField label="EXF" id="exf" required>
        <Input
          id="exf"
          type="date"
          value={g.exf}
          onChange={(e) => updateGeneral('exf', e.target.value)}
        />
      </FormField>
      <FormField label="Teslim Şekli" id="deliveryTerm">
        <select
          id="deliveryTerm"
          value={g.deliveryTerm}
          onChange={(e) => updateGeneral('deliveryTerm', e.target.value)}
          className={selectClass}
        >
          {DELIVERY_TERMS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Ödeme Şekli" id="paymentTerm">
        <select
          id="paymentTerm"
          value={g.paymentTerm}
          onChange={(e) => updateGeneral('paymentTerm', e.target.value)}
          className={selectClass}
        >
          {PAYMENT_TERMS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Fabrika" id="factory">
        <select
          id="factory"
          value={g.factory}
          onChange={(e) => updateGeneral('factory', e.target.value)}
          className={selectClass}
        >
          <option value="">Seçiniz</option>
          {FACTORIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Üretici" id="manufacturer">
        <select
          id="manufacturer"
          value={g.manufacturer}
          onChange={(e) => updateGeneral('manufacturer', e.target.value)}
          className={selectClass}
        >
          {MANUFACTURERS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Sezon" id="season">
        <select
          id="season"
          value={g.season}
          onChange={(e) => updateGeneral('season', e.target.value)}
          className={selectClass}
        >
          {SEASONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Koleksiyon" id="collection">
        <select
          id="collection"
          value={g.collection}
          onChange={(e) => updateGeneral('collection', e.target.value)}
          className={selectClass}
        >
          {COLLECTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Para Birimi" id="currency">
        <select
          id="currency"
          value={g.currency}
          onChange={(e) => updateGeneral('currency', e.target.value)}
          className={selectClass}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Açıklama" id="notes" className="md:col-span-2 lg:col-span-3">
        <textarea
          id="notes"
          value={g.notes}
          onChange={(e) => updateGeneral('notes', e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder="Sipariş notları, özel talimatlar..."
        />
      </FormField>
    </FormGrid>
  )
}
