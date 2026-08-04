import { useMasterDataReferenceOptions } from '@/application/master-data/use-master-data'
import { Input } from '@/components/ui/input'

export type ProductCardFormValues = {
  productCode: string
  productName: string
  customerModelNo: string
  internalModelNo: string
  pattern: string
  weight: string
  description: string
  customerId: string
  brandId: string
  seasonId: string
  sizeSetId: string
}

type Props = {
  values: ProductCardFormValues
  onChange: (key: keyof ProductCardFormValues, value: string) => void
  codeReadOnly?: boolean
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm'

export function ProductCardFormFields({ values, onChange, codeReadOnly }: Props) {
  const { data: customers = [] } = useMasterDataReferenceOptions('customer')
  const { data: brands = [] } = useMasterDataReferenceOptions('brand')
  const { data: seasons = [] } = useMasterDataReferenceOptions('season')
  const { data: sizeSets = [] } = useMasterDataReferenceOptions('sizeSet')

  return (
    <>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Ürün Kodu *</span>
        <Input
          value={values.productCode}
          onChange={(e) => onChange('productCode', e.target.value)}
          required
          readOnly={codeReadOnly}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Ürün Adı *</span>
        <Input
          value={values.productName}
          onChange={(e) => onChange('productName', e.target.value)}
          required
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Müşteri Model No</span>
        <Input
          value={values.customerModelNo}
          onChange={(e) => onChange('customerModelNo', e.target.value)}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">İç Model No</span>
        <Input
          value={values.internalModelNo}
          onChange={(e) => onChange('internalModelNo', e.target.value)}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Kalıp</span>
        <Input value={values.pattern} onChange={(e) => onChange('pattern', e.target.value)} />
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Gramaj</span>
        <Input value={values.weight} onChange={(e) => onChange('weight', e.target.value)} />
      </label>
      <label className="space-y-2 text-sm md:col-span-2">
        <span className="font-medium">Açıklama</span>
        <Input
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Müşteri</span>
        <select
          className={selectClass}
          value={values.customerId}
          onChange={(e) => onChange('customerId', e.target.value)}
        >
          <option value="">Varsayılan</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Marka</span>
        <select
          className={selectClass}
          value={values.brandId}
          onChange={(e) => onChange('brandId', e.target.value)}
        >
          <option value="">Varsayılan</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code} — {b.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Sezon</span>
        <select
          className={selectClass}
          value={values.seasonId}
          onChange={(e) => onChange('seasonId', e.target.value)}
        >
          <option value="">Varsayılan</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Beden Seti</span>
        <select
          className={selectClass}
          value={values.sizeSetId}
          onChange={(e) => onChange('sizeSetId', e.target.value)}
        >
          <option value="">Varsayılan</option>
          {sizeSets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}

export function emptyProductCardFormValues(): ProductCardFormValues {
  return {
    productCode: '',
    productName: '',
    customerModelNo: '',
    internalModelNo: '',
    pattern: '',
    weight: '',
    description: '',
    customerId: '',
    brandId: '',
    seasonId: '',
    sizeSetId: '',
  }
}
