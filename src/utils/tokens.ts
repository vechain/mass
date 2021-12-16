import { AssetType } from '../explorer-db/types';
import {deepEqual} from 'assert'

const tokens = new Map<keyof typeof AssetType, { decimals: number }>([
    ['PLA', { decimals: 18 }],
    ['SHA', { decimals: 18 }],
    ['EHrT', { decimals: 18 }],
    ['DBET', { decimals: 18 }],
    ['TIC', { decimals: 18 }],
    ['OCE', { decimals: 18 }],
    ['SNK', { decimals: 18 }],
    ['JUR', { decimals: 18 }],
    ['AQD', { decimals: 18 }],
    ['YEET', { decimals: 18 }],
    ['HAI', { decimals: 8 }],
    ['MDN', { decimals: 18 }],
    ['VEED', { decimals: 18 }],
    ['VPU', { decimals: 18 }],
    ['MVG', { decimals: 18 }],
    ['WoV', { decimals: 18 }],
    ['GEMS', { decimals: 18 }],
    ['VEX', { decimals: 18 }],
])

const AssetLiterals = Object.keys(AssetType).filter(x => x !== parseFloat(x).toString())
const AssetMap = new Map<string, string>()
for (let asset of AssetLiterals) {
    AssetMap.set(asset.toLowerCase(), asset)
}

const t = [...AssetLiterals].filter(x => x !== 'VET' && x !== 'VTHO')
deepEqual(t, [...tokens.keys()], 'utils.tokens is not the same to tokens in db')

export const normalizeAsset = (asset: string): string | null => {
    const key = asset.toLowerCase()
    if (AssetMap.has(key)) {
        return AssetMap.get(key)!
    }
    return null
}

export const getToken = (symbol: keyof typeof AssetType) => {
    return tokens.get(symbol)!
}