import { useCallback, useMemo, useState } from 'react'

import { queryProductCardById } from '@/domain/product-card/product-card-crud.service'
import { toLegacyBomLines } from '@/domain/services/textile/bom-service'
import { toLegacyProductColors } from '@/domain/services/textile/color-management-service'
import { getSizeSetSizes } from '@/domain/data/size-sets'
import {
  EMBROIDERY_TYPES,
  FABRIC_TYPES,
  FITS,
  MANUFACTURERS,
  OPERATIONS,
  PRINT_TYPES,
  SIZE_PRESETS,
  WASH_TYPES,
  getDefaultCollectionName,
  getDefaultColorCardOptions,
  getDefaultCurrencyCode,
  getDefaultIncotermCode,
  getDefaultPaymentTermName,
  getDefaultProductGroupName,
  getDefaultProductType,
  getDefaultSeasonName,
  getDefaultSubGroupName,
  getWarehouseNameByOperationCode,
} from '@/modules/core/data/master-data'
import {
  calculateMaterialRequirements,
  createDefaultBomLines,
} from '@/modules/core/utils/bom-calculator'

import type {
  MatrixTotals,
  OrderColor,
  OrderCreateForm,
  OrderDocument,
  OrderMilestone,
  OrderOperation,
} from '../types/create-order'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function createDefaultColors(): OrderColor[] {
  return getDefaultColorCardOptions(2).map((c) => ({
    id: createId('clr'),
    code: c.code,
    pantone: c.pantone,
    description: c.description,
    active: true,
  }))
}

function createDefaultOperations(): OrderOperation[] {
  return OPERATIONS.map((op) => ({
    id: createId('op'),
    code: op.code,
    name: op.name,
    sequence: op.sequence,
    workshop: getWarehouseNameByOperationCode(op.code),
    plannedDays: op.sequence / 10,
    active: true,
  }))
}

function createDefaultMilestones(): OrderMilestone[] {
  const kesimWorkshop = getWarehouseNameByOperationCode('KES')
  const dikimWorkshop = getWarehouseNameByOperationCode('DIK')
  return [
    { id: createId('ms'), name: 'Kumaş Onayı', date: '', responsible: 'Planlama', status: 'Planlandı' },
    { id: createId('ms'), name: 'Kesim Başlangıç', date: '', responsible: kesimWorkshop, status: 'Planlandı' },
    { id: createId('ms'), name: 'Dikim Başlangıç', date: '', responsible: dikimWorkshop, status: 'Planlandı' },
    { id: createId('ms'), name: 'EXF', date: '', responsible: 'Planlama', status: 'Planlandı' },
  ]
}

function createInitialForm(): OrderCreateForm {
  return {
    productCardId: '',
    selectedProductSummary: null,
    general: {
      customer: '',
      brand: '',
      buyer: '',
      merchandiser: '',
      poNo: '',
      poDate: todayIso(),
      orderDate: todayIso(),
      exf: '',
      deliveryTerm: getDefaultIncotermCode(),
      paymentTerm: getDefaultPaymentTermName(),
      factory: '',
      manufacturer: MANUFACTURERS[0],
      season: getDefaultSeasonName(),
      collection: getDefaultCollectionName(),
      currency: getDefaultCurrencyCode(),
      notes: '',
    },
    product: {
      productCode: '',
      modelCode: '',
      modelName: '',
      productGroup: getDefaultProductGroupName(),
      subGroup: getDefaultSubGroupName(),
      productType: getDefaultProductType(),
      fit: FITS[1],
      fabricType: FABRIC_TYPES[0] ?? '',
      wash: WASH_TYPES[6],
      print: PRINT_TYPES[0],
      embroidery: EMBROIDERY_TYPES[0],
      pattern: '',
      weight: '',
      composition: '',
    },
    colors: createDefaultColors(),
    sizes: [...SIZE_PRESETS.letter],
    matrix: {},
    bom: createDefaultBomLines(),
    operations: createDefaultOperations(),
    milestones: createDefaultMilestones(),
    documents: [],
  }
}

function computeMatrixTotals(
  colors: OrderColor[],
  sizes: string[],
  matrix: Record<string, Record<string, number>>,
): MatrixTotals {
  const activeColors = colors.filter((c) => c.active)
  const byColor: Record<string, number> = {}
  const bySize: Record<string, number> = {}
  let grandTotal = 0

  for (const color of activeColors) {
    let colorTotal = 0
    for (const size of sizes) {
      const qty = matrix[color.id]?.[size] ?? 0
      colorTotal += qty
      bySize[size] = (bySize[size] ?? 0) + qty
    }
    byColor[color.id] = colorTotal
    grandTotal += colorTotal
  }

  return { byColor, bySize, grandTotal }
}

export function useOrderCreate() {
  const [form, setForm] = useState<OrderCreateForm>(createInitialForm)

  const totals = useMemo(
    () => computeMatrixTotals(form.colors, form.sizes, form.matrix),
    [form.colors, form.sizes, form.matrix],
  )

  const materialRequirements = useMemo(
    () => calculateMaterialRequirements(form.bom, totals.grandTotal),
    [form.bom, totals.grandTotal],
  )

  const updateGeneral = useCallback(
    (field: keyof OrderCreateForm['general'], value: string) => {
      setForm((prev) => ({
        ...prev,
        general: { ...prev.general, [field]: value },
      }))
    },
    [],
  )

  const updateProduct = useCallback(
    (field: keyof OrderCreateForm['product'], value: string) => {
      setForm((prev) => ({
        ...prev,
        product: { ...prev.product, [field]: value },
      }))
    },
    [],
  )

  const selectProductCard = useCallback(
    (
      productCardId: string,
      summary: OrderCreateForm['selectedProductSummary'],
    ) => {
      const pc = queryProductCardById(productCardId)
      if (!pc) return
      const colors = toLegacyProductColors(pc.colorAssignments).map((c) => ({
        id: c.id,
        code: c.internalCode,
        pantone: c.pantone ?? '',
        description: c.name,
        active: c.active,
      }))
      const sizes = getSizeSetSizes(pc.refs.sizeSetId)
      const bom = toLegacyBomLines(pc.bom)
      setForm((prev) => ({
        ...prev,
        productCardId,
        selectedProductSummary: summary,
        colors,
        sizes,
        bom,
        matrix: {},
        general: {
          ...prev.general,
          customer: pc.resolved.customer,
          brand: pc.resolved.brand,
          buyer: pc.resolved.buyer,
          merchandiser: pc.resolved.merchandiser,
          season: pc.resolved.season,
          collection: pc.resolved.collection,
        },
        product: {
          ...prev.product,
          productCode: pc.productCode,
          modelCode: pc.internalModelNo,
          modelName: pc.productName,
          productGroup: pc.resolved.productGroup,
          subGroup: pc.resolved.subGroup,
        },
      }))
    },
    [],
  )

  const addColor = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          id: createId('clr'),
          code: '',
          pantone: '',
          description: '',
          active: true,
        },
      ],
    }))
  }, [])

  const updateColor = useCallback(
    (id: string, field: keyof OrderColor, value: string | boolean) => {
      setForm((prev) => ({
        ...prev,
        colors: prev.colors.map((c) =>
          c.id === id ? { ...c, [field]: value } : c,
        ),
      }))
    },
    [],
  )

  const removeColor = useCallback((id: string) => {
    setForm((prev) => {
      const { [id]: _, ...restMatrix } = prev.matrix
      return {
        ...prev,
        colors: prev.colors.filter((c) => c.id !== id),
        matrix: restMatrix,
      }
    })
  }, [])

  const toggleSize = useCallback((size: string) => {
    setForm((prev) => {
      const has = prev.sizes.includes(size)
      const sizes = has
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size].sort(
            (a, b) =>
              prev.sizes.indexOf(a as never) - prev.sizes.indexOf(b as never),
          )
      const matrix = { ...prev.matrix }
      if (has) {
        for (const colorId of Object.keys(matrix)) {
          const { [size]: _, ...rest } = matrix[colorId]
          matrix[colorId] = rest
        }
      }
      return { ...prev, sizes, matrix }
    })
  }, [])

  const setMatrixQty = useCallback(
    (colorId: string, size: string, qty: number) => {
      setForm((prev) => ({
        ...prev,
        matrix: {
          ...prev.matrix,
          [colorId]: {
            ...prev.matrix[colorId],
            [size]: Math.max(0, qty),
          },
        },
      }))
    },
    [],
  )

  const addBomLine = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      bom: [
        ...prev.bom,
        {
          id: createId('bom'),
          stockCardId: '',
          consumption: 0,
          wastePercent: 0,
          actualConsumption: 0,
        },
      ],
    }))
  }, [])

  const updateBomLine = useCallback(
    (
      id: string,
      field: 'stockCardId' | 'consumption' | 'wastePercent',
      value: string | number,
    ) => {
      setForm((prev) => ({
        ...prev,
        bom: prev.bom.map((line) => {
          if (line.id !== id) return line
          const updated = { ...line, [field]: value }
          if (field === 'consumption' || field === 'wastePercent') {
            const consumption =
              field === 'consumption' ? Number(value) : line.consumption
            const wastePercent =
              field === 'wastePercent' ? Number(value) : line.wastePercent
            updated.actualConsumption =
              Math.round(consumption * (1 + wastePercent / 100) * 10000) / 10000
          }
          return updated
        }),
      }))
    },
    [],
  )

  const removeBomLine = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      bom: prev.bom.filter((line) => line.id !== id),
    }))
  }, [])

  const updateOperation = useCallback(
    (
      id: string,
      field: keyof OrderOperation,
      value: string | number | boolean,
    ) => {
      setForm((prev) => ({
        ...prev,
        operations: prev.operations.map((op) =>
          op.id === id ? { ...op, [field]: value } : op,
        ),
      }))
    },
    [],
  )

  const updateMilestone = useCallback(
    (
      id: string,
      field: keyof OrderMilestone,
      value: string,
    ) => {
      setForm((prev) => ({
        ...prev,
        milestones: prev.milestones.map((ms) =>
          ms.id === id ? { ...ms, [field]: value } : ms,
        ),
      }))
    },
    [],
  )

  const addDocument = useCallback(() => {
    const doc: OrderDocument = {
      id: createId('doc'),
      name: `Teknik_Föy_${form.product.modelCode || 'MODEL'}.pdf`,
      type: 'PDF',
      uploadedAt: new Date().toLocaleDateString('tr-TR'),
      size: '2.4 MB',
    }
    setForm((prev) => ({
      ...prev,
      documents: [...prev.documents, doc],
    }))
  }, [form.product.modelCode])

  const removeDocument = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== id),
    }))
  }, [])

  function validateForm(): { success: boolean; message: string } {
    if (!form.general.customer) {
      return { success: false, message: 'Müşteri seçimi zorunludur.' }
    }
    if (!form.productCardId) {
      return { success: false, message: 'Onaylı ürün kartı seçimi zorunludur.' }
    }
    if (totals.grandTotal <= 0) {
      return { success: false, message: 'Renk x beden matrisinde en az bir adet girilmelidir.' }
    }
    return { success: true, message: '' }
  }

  function toCreateCommand(actorUserId: string) {
    return {
      productCardId: form.productCardId,
      general: form.general,
      matrix: form.matrix,
      unitPrice: 12.5,
      lineDeliveryDate: form.general.exf || undefined,
      actorUserId,
    }
  }

  return {
    form,
    totals,
    materialRequirements,
    updateGeneral,
    updateProduct,
    selectProductCard,
    addColor,
    updateColor,
    removeColor,
    toggleSize,
    setMatrixQty,
    addBomLine,
    updateBomLine,
    removeBomLine,
    updateOperation,
    updateMilestone,
    addDocument,
    removeDocument,
    validateForm,
    toCreateCommand,
  }
}

export type UseOrderCreateReturn = ReturnType<typeof useOrderCreate>
