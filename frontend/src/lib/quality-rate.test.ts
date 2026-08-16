import { describe, expect, it } from 'vitest'
import { getQualityRateTone, QUALITY_RATE_TONE_CLASS } from './quality-rate'

describe('getQualityRateTone', () => {
  it('%2 ve altını yeşil (success) olarak sınıflandırır', () => {
    expect(getQualityRateTone(0)).toBe('success')
    expect(getQualityRateTone(1)).toBe('success')
    expect(getQualityRateTone(2)).toBe('success') // sınır değer — dahil
  })

  it('%2 ile %5 arasını turuncu (warning) olarak sınıflandırır', () => {
    expect(getQualityRateTone(2.01)).toBe('warning') // sınırın hemen üstü
    expect(getQualityRateTone(3.5)).toBe('warning')
    expect(getQualityRateTone(5)).toBe('warning') // sınır değer — dahil
  })

  it('%5 üstünü kırmızı (danger) olarak sınıflandırır', () => {
    expect(getQualityRateTone(5.01)).toBe('danger') // sınırın hemen üstü
    expect(getQualityRateTone(10)).toBe('danger')
    expect(getQualityRateTone(100)).toBe('danger')
  })

  it('her tone için bir CSS sınıfı tanımlı olmalı', () => {
    expect(QUALITY_RATE_TONE_CLASS.success).toBeTruthy()
    expect(QUALITY_RATE_TONE_CLASS.warning).toBeTruthy()
    expect(QUALITY_RATE_TONE_CLASS.danger).toBeTruthy()
  })
})
