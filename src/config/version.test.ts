import { describe, expect, it } from 'vitest'
import { getLoaderClass, getLoaderIcon, getLoaderImage, getLoaderName } from './version'

describe('NeoForge loader mapping', () => {
  it.each(['NeoForge', 'NeoForged', 'neo-forge', 'neo_forged'])('normalizes %s to the NeoForge assets', (loader) => {
    expect(getLoaderName(loader)).toBe('NeoForge')
    expect(getLoaderIcon(loader)).toBe('fire')
    expect(getLoaderImage(loader)).toBe('/img/item/neoforge.png')
    expect(getLoaderClass(loader)).toBe('neoforge')
  })
})
