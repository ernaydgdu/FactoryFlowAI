import {
  createBrand,
  createBuyer,
  createCollection,
  createColorCard,
  createContainerType,
  createCountry,
  createCurrency,
  createCustomer,
  createEmployee,
  createForwarder,
  createMachine,
  createMerchandiser,
  createSeason,
  createSizeSet,
  createSupplier,
  createTransportCompany,
  createWarehouse,
  createWorkshop,
} from './factory'
import {
  TEXTILE_ACCESSORY_CATEGORIES,
  TEXTILE_ACCESSORY_TYPES,
  TEXTILE_EXTRA_CURRENCIES,
  TEXTILE_FABRIC_COMPOSITIONS,
  TEXTILE_FABRIC_TYPES,
  TEXTILE_INCOTERMS,
  TEXTILE_OPERATIONS,
  TEXTILE_PAYMENT_TERMS,
  TEXTILE_PRODUCTION_LINES,
  TEXTILE_PRODUCT_GROUPS,
  TEXTILE_SUB_PRODUCT_GROUPS,
} from './textile-master-seed'

export const COUNTRIES = [
  createCountry({ id: 'cnt-tr', code: 'TR', name: 'Türkiye', iso2: 'TR', iso3: 'TUR' }),
  createCountry({ id: 'cnt-es', code: 'ES', name: 'İspanya', iso2: 'ES', iso3: 'ESP' }),
  createCountry({ id: 'cnt-in', code: 'IN', name: 'Hindistan', iso2: 'IN', iso3: 'IND' }),
  createCountry({ id: 'cnt-cn', code: 'CN', name: 'Çin', iso2: 'CN', iso3: 'CHN' }),
  createCountry({ id: 'cnt-bd', code: 'BD', name: 'Bangladeş', iso2: 'BD', iso3: 'BGD' }),
  createCountry({ id: 'cnt-de', code: 'DE', name: 'Almanya', iso2: 'DE', iso3: 'DEU' }),
  createCountry({ id: 'cnt-gb', code: 'GB', name: 'Birleşik Krallık', iso2: 'GB', iso3: 'GBR' }),
]

export const CURRENCIES = [
  createCurrency({ id: 'cur-usd', code: 'USD', name: 'ABD Doları', symbol: '$', isoCode: 'USD' }),
  createCurrency({ id: 'cur-eur', code: 'EUR', name: 'Euro', symbol: '€', isoCode: 'EUR' }),
  createCurrency({ id: 'cur-try', code: 'TRY', name: 'Türk Lirası', symbol: '₺', isoCode: 'TRY' }),
  createCurrency({ id: 'cur-gbp', code: 'GBP', name: 'Sterlin', symbol: '£', isoCode: 'GBP' }),
  ...TEXTILE_EXTRA_CURRENCIES.map((c) =>
    createCurrency({ id: c.id, code: c.code, name: c.name, symbol: c.symbol, isoCode: c.isoCode }),
  ),
]

export const CUSTOMERS = [
  createCustomer({ id: 'cus-lcw', code: 'LCW', name: 'LC Waikiki', countryId: 'cnt-tr', currencyId: 'cur-usd', city: 'İstanbul' }),
  createCustomer({ id: 'cus-def', code: 'DEF', name: 'DeFacto', countryId: 'cnt-tr', currencyId: 'cur-usd', city: 'İstanbul' }),
  createCustomer({ id: 'cus-kot', code: 'KOT', name: 'Koton', countryId: 'cnt-tr', currencyId: 'cur-eur', city: 'İstanbul' }),
  createCustomer({ id: 'cus-mav', code: 'MAV', name: 'Mavi', countryId: 'cnt-tr', currencyId: 'cur-usd', city: 'İstanbul' }),
  createCustomer({ id: 'cus-pen', code: 'PEN', name: 'Penti', countryId: 'cnt-tr', currencyId: 'cur-eur', city: 'İstanbul' }),
  createCustomer({ id: 'cus-zar', code: 'ZAR', name: 'Zara TR', countryId: 'cnt-es', currencyId: 'cur-eur', city: 'İstanbul' }),
  createCustomer({ id: 'cus-man', code: 'MAN', name: 'Mango TR', countryId: 'cnt-es', currencyId: 'cur-eur', city: 'İstanbul' }),
  createCustomer({ id: 'cus-hm', code: 'HNM', name: 'H&M TR', countryId: 'cnt-de', currencyId: 'cur-eur', city: 'İstanbul' }),
]

export const BRANDS = [
  createBrand({ id: 'brd-lcw', code: 'LCW', name: 'LC Waikiki', customerId: 'cus-lcw' }),
  createBrand({ id: 'brd-def', code: 'DEF', name: 'DeFacto', customerId: 'cus-def' }),
  createBrand({ id: 'brd-kot', code: 'KOT', name: 'Koton', customerId: 'cus-kot' }),
  createBrand({ id: 'brd-mav', code: 'MAV', name: 'Mavi', customerId: 'cus-mav' }),
  createBrand({ id: 'brd-pen', code: 'PEN', name: 'Penti', customerId: 'cus-pen' }),
  createBrand({ id: 'brd-zar', code: 'ZAR', name: 'Zara', customerId: 'cus-zar' }),
  createBrand({ id: 'brd-man', code: 'MAN', name: 'Mango', customerId: 'cus-man' }),
  createBrand({ id: 'brd-hm', code: 'HNM', name: 'H&M', customerId: 'cus-hm' }),
]

export const BUYERS = [
  createBuyer({ id: 'buy-sm', code: 'BUY-SM', name: 'Sarah Mitchell', customerId: 'cus-lcw', email: 's.mitchell@lcwaikiki.com' }),
  createBuyer({ id: 'buy-jk', code: 'BUY-JK', name: 'James Kowalski', customerId: 'cus-def', email: 'j.kowalski@defacto.com.tr' }),
  createBuyer({ id: 'buy-ao', code: 'BUY-AO', name: 'Aylin Öztürk', customerId: 'cus-kot', email: 'a.ozturk@koton.com.tr' }),
  createBuyer({ id: 'buy-mc', code: 'BUY-MC', name: 'Marco Costa', customerId: 'cus-zar', email: 'm.costa@inditex.com' }),
  createBuyer({ id: 'buy-el', code: 'BUY-EL', name: 'Elena Lopez', customerId: 'cus-man', email: 'e.lopez@mango.com' }),
]

export const MERCHANDISERS = [
  createMerchandiser({ id: 'mer-za', code: 'MER-ZA', name: 'Zeynep Arslan', customerId: 'cus-lcw', email: 'z.arslan@lcwaikiki.com' }),
  createMerchandiser({ id: 'mer-cd', code: 'MER-CD', name: 'Can Demir', customerId: 'cus-def', email: 'c.demir@defacto.com.tr' }),
  createMerchandiser({ id: 'mer-es', code: 'MER-ES', name: 'Elif Şahin', customerId: 'cus-kot', email: 'e.sahin@koton.com.tr' }),
  createMerchandiser({ id: 'mer-pt', code: 'MER-PT', name: 'Pınar Tekin', customerId: 'cus-mav', email: 'p.tekin@mavi.com' }),
]

export const SUPPLIERS = [
  createSupplier({ id: 'sup-arv', code: 'ARVIND', name: 'Arvind Mills', countryId: 'cnt-in', category: 'Kumaş', leadTimeDays: 21, currencyId: 'cur-usd' }),
  createSupplier({ id: 'sup-bos', code: 'BOSSA', name: 'Bossa', countryId: 'cnt-tr', category: 'Kumaş', leadTimeDays: 14, currencyId: 'cur-usd' }),
  createSupplier({ id: 'sup-isk', code: 'ISKO', name: 'Isko', countryId: 'cnt-tr', category: 'Kumaş', leadTimeDays: 18, currencyId: 'cur-eur' }),
  createSupplier({ id: 'sup-ykk', code: 'YKK', name: 'YKK Türkiye', countryId: 'cnt-tr', category: 'Aksesuar', leadTimeDays: 14, currencyId: 'cur-try' }),
  createSupplier({ id: 'sup-lbl', code: 'LABELPRO', name: 'Label Pro', countryId: 'cnt-tr', category: 'Aksesuar', leadTimeDays: 21, currencyId: 'cur-try' }),
  createSupplier({ id: 'sup-san', code: 'SANKO', name: 'Sanko', countryId: 'cnt-tr', category: 'Her İkisi', leadTimeDays: 10, currencyId: 'cur-try' }),
  createSupplier({ id: 'sup-coats', code: 'COATS', name: 'Coats Türkiye', countryId: 'cnt-tr', category: 'Aksesuar', leadTimeDays: 7, currencyId: 'cur-usd' }),
]

export const WAREHOUSES = [
  createWarehouse({ id: 'wh-root-hmd', code: 'GRP-HMD', name: 'Ana Hammadde', type: 'Hammadde', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'ROOT' }),
  createWarehouse({ id: 'wh-hmd', code: 'HMD-01', name: 'Hammadde Deposu', type: 'Hammadde', location: 'İstanbul', countryId: 'cnt-tr', parentId: 'wh-root-hmd', hierarchyGroup: 'Ana Hammadde' }),
  createWarehouse({ id: 'wh-root-kms', code: 'GRP-KMS', name: 'Ana Kumaş', type: 'Kumaş', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'ROOT' }),
  createWarehouse({ id: 'wh-kms', code: 'KMS-01', name: 'Kumaş Deposu', type: 'Kumaş', location: 'İstanbul', countryId: 'cnt-tr', parentId: 'wh-root-kms', hierarchyGroup: 'Ana Kumaş' }),
  createWarehouse({ id: 'wh-root-aks', code: 'GRP-AKS', name: 'Ana Aksesuar', type: 'Aksesuar', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'ROOT' }),
  createWarehouse({ id: 'wh-aks', code: 'AKS-01', name: 'Aksesuar Deposu', type: 'Aksesuar', location: 'İstanbul', countryId: 'cnt-tr', parentId: 'wh-root-aks', hierarchyGroup: 'Ana Aksesuar' }),
  createWarehouse({ id: 'wh-kes', code: 'KES-01', name: 'Kesimhane', type: 'Kesimhane', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'Üretim' }),
  createWarehouse({ id: 'wh-fsn-a', code: 'FSN-A', name: 'Fason Atölye A', type: 'Fason', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'Atölye' }),
  createWarehouse({ id: 'wh-fsn-b', code: 'FSN-B', name: 'Fason Atölye B', type: 'Fason', location: 'Bursa', countryId: 'cnt-tr', hierarchyGroup: 'Atölye' }),
  createWarehouse({ id: 'wh-fsn-c', code: 'FSN-C', name: 'Fason Atölye C', type: 'Fason', location: 'İzmir', countryId: 'cnt-tr', hierarchyGroup: 'Atölye' }),
  createWarehouse({ id: 'wh-ykm', code: 'YKM-01', name: 'Yıkama', type: 'Yıkama', location: 'Bursa', countryId: 'cnt-tr', hierarchyGroup: 'Finishing' }),
  createWarehouse({ id: 'wh-klt', code: 'KLT-01', name: 'Kalite', type: 'Kalite', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'Finishing' }),
  createWarehouse({ id: 'wh-upk', code: 'UPK-01', name: 'Ütü Paket', type: 'Ütü Paket', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'Finishing' }),
  createWarehouse({ id: 'wh-mml', code: 'MML-01', name: 'Mamül Deposu', type: 'Mamül', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'Sevkiyat' }),
  createWarehouse({ id: 'wh-fir', code: 'FIR-01', name: 'Fire Deposu', type: 'Fire', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'Atık' }),
  createWarehouse({ id: 'wh-hrd', code: 'HRD-01', name: 'Hurda Deposu', type: 'Hurda', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'Atık' }),
  createWarehouse({ id: 'wh-num', code: 'NUM-01', name: 'Numune Deposu', type: 'Numune', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'Numune' }),
  createWarehouse({ id: 'wh-iad', code: 'IAD-01', name: 'İade Deposu', type: 'İade', location: 'İstanbul', countryId: 'cnt-tr', hierarchyGroup: 'İade' }),
]

export const WORKSHOPS = [
  createWorkshop({ id: 'wsh-a', code: 'FSN-A', name: 'Fason Atölye A', warehouseId: 'wh-fsn-a', location: 'İstanbul', monthlyCapacity: 5000, currentLoad: 3200 }),
  createWorkshop({ id: 'wsh-b', code: 'FSN-B', name: 'Fason Atölye B', warehouseId: 'wh-fsn-b', location: 'Bursa', monthlyCapacity: 8000, currentLoad: 6100 }),
  createWorkshop({ id: 'wsh-c', code: 'FSN-C', name: 'Fason Atölye C', warehouseId: 'wh-fsn-c', location: 'İzmir', monthlyCapacity: 3000, currentLoad: 1800 }),
]

export const SEASONS = [
  createSeason({ id: 'ssn-ss26', code: 'SS26', name: 'Spring/Summer 2026', year: 2026, period: 'SS', seasonTypeId: 'sst-ss' }),
  createSeason({ id: 'ssn-aw26', code: 'AW26', name: 'Autumn/Winter 2026', year: 2026, period: 'AW', seasonTypeId: 'sst-aw' }),
  createSeason({ id: 'ssn-core', code: 'CORE', name: 'Core Collection', year: 2026, period: 'CORE', seasonTypeId: 'sst-basic' }),
  createSeason({ id: 'ssn-res26', code: 'RES26', name: 'Resort 2026', year: 2026, period: 'RESORT', seasonTypeId: 'sst-holiday' }),
  createSeason({ id: 'ssn-nos', code: 'NOS', name: 'NOS Collection', year: 2026, period: 'CORE', seasonTypeId: 'sst-nos' }),
]

export const COLLECTIONS = [
  createCollection({ id: 'col-core', code: 'CORE', name: 'Core', seasonId: 'ssn-core', brandId: 'brd-lcw' }),
  createCollection({ id: 'col-prem', code: 'PREMIUM', name: 'Premium', seasonId: 'ssn-ss26', brandId: 'brd-man' }),
  createCollection({ id: 'col-basic', code: 'BASICS', name: 'Basics', seasonId: 'ssn-ss26', brandId: 'brd-def' }),
  createCollection({ id: 'col-denim', code: 'DENIM', name: 'Denim', seasonId: 'ssn-ss26', brandId: 'brd-mav' }),
]

export const PRODUCT_GROUPS = TEXTILE_PRODUCT_GROUPS
export const SUB_PRODUCT_GROUPS = TEXTILE_SUB_PRODUCT_GROUPS

export const SIZE_SETS = [
  createSizeSet({ id: 'ss-tshirt', code: 'SS-TSHIRT', name: 'Tişört Standard', productType: 'Tişört', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] }),
  createSizeSet({ id: 'ss-polo', code: 'SS-POLO', name: 'Polo Standard', productType: 'Polo', sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'] }),
  createSizeSet({ id: 'ss-pant', code: 'SS-PANT', name: 'Pantolon Numeric', productType: 'Pantolon', sizes: ['28', '29', '30', '31', '32', '33', '34', '36'] }),
  createSizeSet({ id: 'ss-jean', code: 'SS-JEAN', name: 'Jean Numeric', productType: 'Jean', sizes: ['28', '29', '30', '31', '32', '33', '34'] }),
  createSizeSet({ id: 'ss-baby', code: 'SS-BABY', name: 'Bebek Set', productType: 'Bebek', sizes: ['0-3 Ay', '3-6 Ay', '6-9 Ay', '9-12 Ay', '12-18 Ay', '18-24 Ay'] }),
  createSizeSet({ id: 'ss-kids', code: 'SS-KIDS', name: 'Çocuk Set', productType: 'Çocuk', sizes: ['4Y', '6Y', '8Y', '10Y', '12Y', '14Y'] }),
  createSizeSet({ id: 'ss-dress', code: 'SS-DRESS', name: 'Elbise Standard', productType: 'Elbise', sizes: ['XS', 'S', 'M', 'L', 'XL'] }),
]

export const COLOR_CARDS = [
  createColorCard({ id: 'clr-indigo', code: 'INDIGO', name: 'Indigo', pantone: '19-4029 TCX', colorGroup: 'Mavi', hex: '#1B3A5F', rgb: { r: 27, g: 58, b: 95 }, internalColorCode: 'IC-IND-001', customerColorCode: 'C-IND-001', description: 'Indigo denim tonu' }),
  createColorCard({ id: 'clr-black', code: 'BLACK', name: 'Black', pantone: '19-0303 TCX', colorGroup: 'Siyah', hex: '#1A1A1A', rgb: { r: 26, g: 26, b: 26 }, internalColorCode: 'IC-BLK-001', customerColorCode: 'C-BLK-001', description: 'Core black' }),
  createColorCard({ id: 'clr-white', code: 'WHITE', name: 'White', pantone: '11-0601 TCX', colorGroup: 'Beyaz', hex: '#F5F5F5', rgb: { r: 245, g: 245, b: 245 }, internalColorCode: 'IC-WHT-001', customerColorCode: 'C-WHT-001', description: 'Optic white' }),
  createColorCard({ id: 'clr-stone', code: 'STONE', name: 'Stone', pantone: '16-1108 TCX', colorGroup: 'Bej', hex: '#C4B8A5', rgb: { r: 196, g: 184, b: 165 }, internalColorCode: 'IC-STN-001', customerColorCode: 'C-STN-001', description: 'Stone wash base' }),
  createColorCard({ id: 'clr-navy', code: 'NAVY', name: 'Navy', pantone: '19-4028 TCX', colorGroup: 'Mavi', hex: '#1F305E', rgb: { r: 31, g: 48, b: 94 }, internalColorCode: 'IC-NVY-001', customerColorCode: 'C-NVY-001', description: 'Navy core' }),
  createColorCard({ id: 'clr-olive', code: 'OLIVE', name: 'Olive', pantone: '18-0622 TCX', colorGroup: 'Yeşil', hex: '#6B7C3C', rgb: { r: 107, g: 124, b: 60 }, internalColorCode: 'IC-OLV-001', customerColorCode: 'C-OLV-001', description: 'Olive utility' }),
  createColorCard({ id: 'clr-red', code: 'RED', name: 'Red', pantone: '18-1664 TCX', colorGroup: 'Kırmızı', hex: '#C41E3A', rgb: { r: 196, g: 30, b: 58 }, internalColorCode: 'IC-RED-001', customerColorCode: 'C-RED-001', description: 'Signal red' }),
  createColorCard({ id: 'clr-grey', code: 'GREY', name: 'Grey Melange', pantone: '17-1500 TCX', colorGroup: 'Gri', hex: '#8B8B8B', rgb: { r: 139, g: 139, b: 139 }, internalColorCode: 'IC-GRY-001', customerColorCode: 'C-GRY-001', description: 'Melange grey' }),
]

export const FABRIC_TYPES = TEXTILE_FABRIC_TYPES
export const FABRIC_COMPOSITIONS = TEXTILE_FABRIC_COMPOSITIONS
export const ACCESSORY_CATEGORIES = TEXTILE_ACCESSORY_CATEGORIES
export const ACCESSORY_TYPES = TEXTILE_ACCESSORY_TYPES
export const OPERATIONS = TEXTILE_OPERATIONS
export const PRODUCTION_LINES = TEXTILE_PRODUCTION_LINES

export const MACHINES = [
  createMachine({ id: 'mc-ovl-1', code: 'OVL-1', name: 'Overlok Hat 1', productionLineId: 'pl-1', machineTypeId: 'mct-overlock', machineType: 'Overlok' }),
  createMachine({ id: 'mc-flat-1', code: 'FLAT-1', name: 'Düz Makine Hat 1', productionLineId: 'pl-1', machineTypeId: 'mct-flat', machineType: 'Düz Makine' }),
  createMachine({ id: 'mc-ovl-2', code: 'OVL-2', name: 'Overlok Hat 2', productionLineId: 'pl-2', machineTypeId: 'mct-overlock', machineType: 'Overlok' }),
  createMachine({ id: 'mc-btn-2', code: 'BTN-2', name: 'Düğme Hat 2', productionLineId: 'pl-2', machineTypeId: 'mct-button', machineType: 'Düğme' }),
  createMachine({ id: 'mc-iron-3', code: 'IRN-3', name: 'Ütü Hat 3', productionLineId: 'pl-3', machineTypeId: 'mct-iron', machineType: 'Ütü' }),
]

export const EMPLOYEES = [
  createEmployee({ id: 'emp-ayse', code: 'EMP-AK', name: 'Ayşe Kaya', role: 'Operatör', department: 'Dikim', email: 'ayse.k@kepler.local', workshopId: 'wsh-a' }),
  createEmployee({ id: 'emp-mehmet', code: 'EMP-MT', name: 'Mehmet Tekin', role: 'Operatör', department: 'Dikim', email: 'mehmet.t@kepler.local', workshopId: 'wsh-b' }),
  createEmployee({ id: 'emp-elif', code: 'EMP-ES', name: 'Elif Şahin', role: 'Operatör', department: 'Dikim', email: 'elif.s@kepler.local', workshopId: 'wsh-a' }),
  createEmployee({ id: 'emp-planner', code: 'EMP-PL', name: 'Ayşe Yılmaz', role: 'Planlayıcı', department: 'Planlama', email: 'ayse.y@kepler.local' }),
  createEmployee({ id: 'emp-qc', code: 'EMP-QC', name: 'Zeynep Kaya', role: 'QC Inspector', department: 'Kalite', email: 'zeynep.k@kepler.local' }),
]

export const TRANSPORT_COMPANIES = [
  createTransportCompany({ id: 'tc-maersk', code: 'MAERSK', name: 'Maersk', serviceType: 'Deniz' }),
  createTransportCompany({ id: 'tc-msc', code: 'MSC', name: 'MSC', serviceType: 'Deniz' }),
  createTransportCompany({ id: 'tc-cma', code: 'CMA', name: 'CMA CGM', serviceType: 'Deniz' }),
  createTransportCompany({ id: 'tc-arkas', code: 'ARKAS', name: 'Arkas', serviceType: 'Multimodal' }),
  createTransportCompany({ id: 'tc-dhl', code: 'DHL', name: 'DHL Global Forwarding', serviceType: 'Hava' }),
]

export const FORWARDERS = [
  createForwarder({ id: 'fwd-maersk', code: 'FWD-MAE', name: 'Maersk Logistics TR', transportCompanyId: 'tc-maersk', contactEmail: 'tr.booking@maersk.com' }),
  createForwarder({ id: 'fwd-arkas', code: 'FWD-ARK', name: 'Arkas Lojistik', transportCompanyId: 'tc-arkas', contactEmail: 'booking@arkas.com.tr' }),
  createForwarder({ id: 'fwd-dhl', code: 'FWD-DHL', name: 'DHL Forwarding TR', transportCompanyId: 'tc-dhl', contactEmail: 'tr.forwarding@dhl.com' }),
]

export const CONTAINER_TYPES = [
  createContainerType({ id: 'ct-20ft', code: '20FT', name: '20FT Standard', teu: 1, maxWeightKg: 21700 }),
  createContainerType({ id: 'ct-40ft', code: '40FT', name: '40FT Standard', teu: 2, maxWeightKg: 26500 }),
  createContainerType({ id: 'ct-40hc', code: '40HC', name: '40FT High Cube', teu: 2, maxWeightKg: 26500 }),
]

export const INCOTERMS = TEXTILE_INCOTERMS
export const PAYMENT_TERMS = TEXTILE_PAYMENT_TERMS
