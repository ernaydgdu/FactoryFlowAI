import { FormField, FormGrid, selectClass } from '@/components/erp/form-field'
import { Input } from '@/components/ui/input'
import {
  EMBROIDERY_TYPES,
  FABRIC_TYPES,
  FITS,
  PRINT_TYPES,
  PRODUCT_GROUPS,
  PRODUCT_SUBGROUPS,
  PRODUCT_TYPES,
  WASH_TYPES,
} from '@/modules/core/data/master-data'

import type { UseOrderCreateReturn } from '../../hooks/use-order-create'

type TabProps = { form: UseOrderCreateReturn }

export function ProductTab({ form: orderForm }: TabProps) {
  const p = orderForm.form.product
  const { updateProduct } = orderForm

  return (
    <FormGrid cols={3}>
      <FormField label="Ürün Kodu" id="productCode" hint="Otomatik veya manuel">
        <Input
          id="productCode"
          value={p.productCode}
          onChange={(e) => updateProduct('productCode', e.target.value)}
          placeholder="URN-SS26-001"
        />
      </FormField>
      <FormField label="Model Kodu" id="modelCode">
        <Input
          id="modelCode"
          value={p.modelCode}
          onChange={(e) => updateProduct('modelCode', e.target.value)}
          placeholder="MDL-4821"
        />
      </FormField>
      <FormField label="Model Adı" id="modelName" required>
        <Input
          id="modelName"
          value={p.modelName}
          onChange={(e) => updateProduct('modelName', e.target.value)}
          placeholder="SS26 Basic Crew Neck Tee"
        />
      </FormField>
      <FormField label="Ürün Grubu" id="productGroup">
        <select
          id="productGroup"
          value={p.productGroup}
          onChange={(e) => updateProduct('productGroup', e.target.value)}
          className={selectClass}
        >
          {PRODUCT_GROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Alt Grup" id="subGroup">
        <select
          id="subGroup"
          value={p.subGroup}
          onChange={(e) => updateProduct('subGroup', e.target.value)}
          className={selectClass}
        >
          {PRODUCT_SUBGROUPS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Ürün Tipi" id="productType">
        <select
          id="productType"
          value={p.productType}
          onChange={(e) => updateProduct('productType', e.target.value)}
          className={selectClass}
        >
          {PRODUCT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Fit" id="fit">
        <select
          id="fit"
          value={p.fit}
          onChange={(e) => updateProduct('fit', e.target.value)}
          className={selectClass}
        >
          {FITS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Kumaş Tipi" id="fabricType">
        <select
          id="fabricType"
          value={p.fabricType}
          onChange={(e) => updateProduct('fabricType', e.target.value)}
          className={selectClass}
        >
          {FABRIC_TYPES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Yıkama" id="wash">
        <select
          id="wash"
          value={p.wash}
          onChange={(e) => updateProduct('wash', e.target.value)}
          className={selectClass}
        >
          {WASH_TYPES.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Baskı" id="print">
        <select
          id="print"
          value={p.print}
          onChange={(e) => updateProduct('print', e.target.value)}
          className={selectClass}
        >
          {PRINT_TYPES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Nakış" id="embroidery">
        <select
          id="embroidery"
          value={p.embroidery}
          onChange={(e) => updateProduct('embroidery', e.target.value)}
          className={selectClass}
        >
          {EMBROIDERY_TYPES.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Kalıp" id="pattern">
        <Input
          id="pattern"
          value={p.pattern}
          onChange={(e) => updateProduct('pattern', e.target.value)}
          placeholder="Kalıp referans no"
        />
      </FormField>
      <FormField label="Gramaj" id="weight">
        <Input
          id="weight"
          value={p.weight}
          onChange={(e) => updateProduct('weight', e.target.value)}
          placeholder="180 g/m²"
        />
      </FormField>
      <FormField label="Kompozisyon" id="composition">
        <Input
          id="composition"
          value={p.composition}
          onChange={(e) => updateProduct('composition', e.target.value)}
          placeholder="%100 Cotton"
        />
      </FormField>
    </FormGrid>
  )
}
