import { defineConfig } from 'jsrepo'

export default defineConfig({
  registries: [
    {
      name: 'vuebits',
      url: 'https://vuebits.org/registry',
    },
  ],
  paths: {
    '*': 'src/components/bits/*',
  },
})
