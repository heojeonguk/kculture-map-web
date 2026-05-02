import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ko', 'en', 'zh-CN', 'ja', 'zh-TW', 'th', 'vi', 'id', 'ms', 'es', 'fr', 'de', 'pt', 'ru', 'ar'],
  defaultLocale: 'en'
})
