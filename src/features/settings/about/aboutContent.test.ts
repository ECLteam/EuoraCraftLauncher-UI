import { describe, expect, it } from 'vitest'
import enUs from '@/i18n/locales/en-US.json'
import zhCn from '@/i18n/locales/zh-CN.json'
import { specialThanksEntries, teamMembers, technologyCategories } from './aboutContent'

const locales = [zhCn.settings.aboutTab, enUs.settings.aboutTab]

describe('about page content', () => {
  it('uses unique stable ids for every rendered entry and category', () => {
    const technologyEntries = technologyCategories.flatMap((category) => category.entries)
    const entryIds = [...teamMembers, ...specialThanksEntries, ...technologyEntries].map((entry) => entry.id)
    const categoryIds = technologyCategories.map((category) => category.id)

    expect(new Set(entryIds).size).toBe(entryIds.length)
    expect(new Set(categoryIds).size).toBe(categoryIds.length)
  })

  it('keeps all content keys available in both locales', () => {
    const entries = [
      ...teamMembers,
      ...specialThanksEntries,
      ...technologyCategories.flatMap((category) => category.entries),
    ]

    for (const locale of locales) {
      for (const entry of entries) {
        expect(locale.descriptions, `missing description: ${entry.descriptionKey}`).toHaveProperty(entry.descriptionKey)
        expect(locale.actions, `missing action: ${entry.actionLabelKey}`).toHaveProperty(entry.actionLabelKey)
      }
      for (const category of technologyCategories) {
        expect(locale.technologyCategories, `missing category: ${category.titleKey}`).toHaveProperty(category.titleKey)
      }
    }
  })
})
