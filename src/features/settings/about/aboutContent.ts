import { URLS } from '@/config/urls'

export type AboutActionLabelKey = 'github' | 'website' | 'mirror'

export interface AboutEntry {
  id: string
  name: string
  initials: string
  descriptionKey: string
  url: string
  actionLabelKey: AboutActionLabelKey
  imageUrl?: string
  iconName?: string
}

export interface TechnologyCategory {
  id: string
  titleKey: string
  entries: AboutEntry[]
}

const avatarUrl = (fileName: string): string => `/img/avatars/${fileName}`

const createGithubEntry = (
  id: string,
  name: string,
  initials: string,
  descriptionKey: string,
  url: string,
  imageFileName?: string
): AboutEntry => ({
  id,
  name,
  initials,
  descriptionKey,
  url,
  actionLabelKey: 'github',
  imageUrl: imageFileName ? avatarUrl(imageFileName) : undefined,
})

export const teamMembers: AboutEntry[] = [
  createGithubEntry('aebc08', 'AEBC08', 'A', 'aebc08', 'https://github.com/AEBC08', 'AEBC08.png'),
  createGithubEntry('wuchang325', 'Wuchang325', 'W', 'wuchang325', 'https://github.com/Wuchang325', 'Wuchang325.png'),
  createGithubEntry('rate', 'RATE', 'R', 'e2662020', 'https://github.com/e2662020', 'RATE.png'),
  createGithubEntry('luyanci', 'YC酱luyancib', 'L', 'luyanci', 'https://github.com/Luyanci', 'luyanci.png'),
]

export const specialThanksEntries: AboutEntry[] = [
  createGithubEntry(
    'qomicex-public',
    'Qomicex-Public',
    'QP',
    'qomicexPublic',
    URLS.qomicexPublic,
    'Qomicex-Public.svg'
  ),
  createGithubEntry(
    'the-mycelium-of-antan',
    'TheMyceliumOfAntan',
    'TM',
    'theMyceliumOfAntan',
    'https://github.com/TheMyceliumOfAntan',
    'TheMyceliumOfAntan.png'
  ),
  {
    id: 'bangbang93',
    name: 'bangbang93',
    initials: 'BB',
    descriptionKey: 'bangbang93',
    url: URLS.bmclapi,
    actionLabelKey: 'mirror',
    iconName: 'search-engine',
    imageUrl: avatarUrl('bangbang93.png'),
  },
  {
    id: 'modrinth',
    name: 'Modrinth',
    initials: 'M',
    descriptionKey: 'modrinth',
    url: URLS.modrinth,
    actionLabelKey: 'website',
    iconName: 'external-site',
    imageUrl: avatarUrl('modrinth.svg'),
  },
  {
    id: 'curseforge',
    name: 'CurseForge',
    initials: 'C',
    descriptionKey: 'curseforge',
    url: URLS.curseforge,
    actionLabelKey: 'website',
    iconName: 'external-site',
    imageUrl: avatarUrl('curseforge.png'),
  },
  {
    id: 'mcmod',
    name: 'MCMOD百科',
    initials: 'MC',
    descriptionKey: 'mcmod',
    url: URLS.mcmod,
    actionLabelKey: 'website',
    iconName: 'external-site',
    imageUrl: avatarUrl('mcmod.png'),
  },
  createGithubEntry('hmcl', 'HMCL', 'H', 'hmcl', URLS.hmcl.repo, 'HMCL.png'),
  createGithubEntry(
    'scaffolding-mc',
    'Scaffolding-MC',
    'S',
    'scaffolding',
    URLS.scaffoldingMC.repo,
    'Scaffolding-MC.png'
  ),
]

const technologies = {
  pyTauri: createGithubEntry('pytauri', 'PyTauri', 'PT', 'pytauri', URLS.pytauri.repo, 'pytauri.png'),
  tauri: createGithubEntry('tauri', 'Tauri', 'T', 'tauri', URLS.tauri.repo),
  easyTier: createGithubEntry('easy-tier', 'EasyTier', 'ET', 'easyTier', URLS.easyTier.repo),
  authlibInjector: createGithubEntry(
    'authlib-injector',
    'Authlib-Injector',
    'AI',
    'authlib',
    URLS.authlibInjector.repo
  ),
  vue: createGithubEntry('vue', 'Vue 3', 'V', 'vue3', URLS.vue.repo),
  vite: createGithubEntry('vite', 'Vite', 'V', 'vite', URLS.vite.repo),
  pinia: createGithubEntry('pinia', 'Pinia', 'P', 'pinia', URLS.pinia.repo),
  vueRouter: createGithubEntry('vue-router', 'Vue Router', 'VR', 'vueRouter', URLS.vueRouter.repo),
  vueI18n: createGithubEntry('vue-i18n', 'Vue I18n', 'VI', 'vueI18n', URLS.vueI18n.repo),
  valibot: createGithubEntry('valibot', 'Valibot', 'V', 'valibot', URLS.valibot.repo),
  typescript: createGithubEntry('typescript', 'TypeScript', 'TS', 'typescript', URLS.typescript.repo),
  naiveUi: createGithubEntry('naive-ui', 'Naive UI', 'N', 'naiveUi', URLS.naiveUi.repo),
  tailwind: createGithubEntry('tailwind', 'Tailwind CSS', 'T', 'tailwind', URLS.tailwind.repo),
  vueUse: createGithubEntry('vue-use', 'VueUse', 'VU', 'vueUse', URLS.vueUse.repo),
  gsap: createGithubEntry('gsap', 'GSAP', 'G', 'gsap', URLS.gsap.repo),
  skinview3d: createGithubEntry('skinview3d', 'skinview3d', 'S', 'skinview3d', URLS.skinview3d.repo),
} satisfies Record<string, AboutEntry>

const backendRuntimeEntries: AboutEntry[] = [
  createGithubEntry('python', 'Python 3.11+', 'PY', 'backendDependency', 'https://github.com/python/cpython'),
  createGithubEntry('aiofiles', 'aiofiles', 'AF', 'backendDependency', 'https://github.com/Tinche/aiofiles'),
  createGithubEntry('anyio', 'AnyIO', 'A', 'backendDependency', 'https://github.com/agronholm/anyio'),
  createGithubEntry(
    'python-dotenv',
    'python-dotenv',
    'DE',
    'backendDependency',
    'https://github.com/theskumar/python-dotenv'
  ),
  createGithubEntry('pydantic', 'Pydantic 2', 'P', 'backendDependency', 'https://github.com/pydantic/pydantic'),
  createGithubEntry('httpx', 'HTTPX', 'H', 'backendDependency', 'https://github.com/encode/httpx'),
  createGithubEntry('mcstatus', 'mcstatus', 'MS', 'backendDependency', 'https://github.com/py-mine/mcstatus'),
  createGithubEntry('psutil', 'psutil', 'PS', 'backendDependency', 'https://github.com/giampaolo/psutil'),
  createGithubEntry('send2trash', 'Send2Trash', 'ST', 'backendDependency', 'https://github.com/arsenetar/send2trash'),
  createGithubEntry('easy-tier-pyo3', 'EasyTier-PyO3', 'EP', 'backendDependency', URLS.easyTierPyo3.repo),
]

const frontendUtilityEntries: AboutEntry[] = [
  createGithubEntry('iconify', 'Iconify', 'I', 'frontendDependency', 'https://github.com/iconify/iconify'),
  createGithubEntry('dompurify', 'DOMPurify', 'DP', 'frontendDependency', 'https://github.com/cure53/DOMPurify'),
  createGithubEntry('marked', 'Marked', 'M', 'frontendDependency', 'https://github.com/markedjs/marked'),
  createGithubEntry('sucrase', 'Sucrase', 'S', 'frontendDependency', 'https://github.com/alangpierce/sucrase'),
]

const engineeringEntries: AboutEntry[] = [
  createGithubEntry('vitest', 'Vitest', 'VT', 'engineeringDependency', 'https://github.com/vitest-dev/vitest'),
  createGithubEntry('eslint', 'ESLint', 'ES', 'engineeringDependency', 'https://github.com/eslint/eslint'),
  createGithubEntry('prettier', 'Prettier', 'PR', 'engineeringDependency', 'https://github.com/prettier/prettier'),
  createGithubEntry('postcss', 'PostCSS', 'PC', 'engineeringDependency', 'https://github.com/postcss/postcss'),
  createGithubEntry(
    'autoprefixer',
    'Autoprefixer',
    'AP',
    'engineeringDependency',
    'https://github.com/postcss/autoprefixer'
  ),
  createGithubEntry('ruff', 'Ruff', 'R', 'engineeringDependency', 'https://github.com/astral-sh/ruff'),
  createGithubEntry(
    'pyinstaller',
    'PyInstaller',
    'PI',
    'engineeringDependency',
    'https://github.com/pyinstaller/pyinstaller'
  ),
]

const fontAndIconEntries: AboutEntry[] = [
  {
    id: 'harmonyos-sans-sc',
    name: 'HarmonyOS Sans SC',
    initials: 'HS',
    descriptionKey: 'harmonyOsSans',
    url: 'https://developer.huawei.com/consumer/cn/design/resource/',
    actionLabelKey: 'website',
    iconName: 'external-site',
  },
  createGithubEntry('maple-mono', 'Maple Mono', 'MM', 'mapleMono', 'https://github.com/subframe7536/maple-font'),
  createGithubEntry('tabler-icons', 'Tabler Icons', 'TI', 'tablerIcons', 'https://github.com/tabler/tabler-icons'),
]

export const technologyCategories: TechnologyCategory[] = [
  {
    id: 'runtime-frameworks',
    titleKey: 'runtimeFrameworks',
    entries: [technologies.pyTauri, technologies.tauri, technologies.easyTier],
  },
  { id: 'backend-runtime', titleKey: 'backendRuntime', entries: backendRuntimeEntries },
  { id: 'account-authentication', titleKey: 'accountAuthentication', entries: [technologies.authlibInjector] },
  {
    id: 'frontend-frameworks',
    titleKey: 'frontendFrameworks',
    entries: [
      technologies.vue,
      technologies.vite,
      technologies.pinia,
      technologies.vueRouter,
      technologies.vueI18n,
      technologies.valibot,
      technologies.typescript,
    ],
  },
  { id: 'ui-styling', titleKey: 'uiStyling', entries: [technologies.naiveUi, technologies.tailwind] },
  {
    id: 'frontend-utilities',
    titleKey: 'frontendUtilities',
    entries: [technologies.vueUse, technologies.gsap, ...frontendUtilityEntries],
  },
  { id: 'rendering', titleKey: 'rendering', entries: [technologies.skinview3d] },
  { id: 'fonts-icons', titleKey: 'fontsAndIcons', entries: fontAndIconEntries },
  { id: 'engineering', titleKey: 'engineering', entries: engineeringEntries },
]
