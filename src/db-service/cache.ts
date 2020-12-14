import * as LRU from 'lru-cache'
import { REVERSIBLE_WINDOW } from '../utils'

export const cache = new LRU<string, any>(128 * 1024) // 128k cache entries

export const keys = {
    BEST: 'BEST',
    LATEST: 'LATEST',
    TOKENS: 'TOKENS',
    BLOCK_BY_ID: (blockID: string) => { return 'BLOCK_BY_ID' + blockID },
    BLOCK_BY_NUMBER: (blockNumber: number) => { return 'BLOCK_BY_NUMBER' + blockNumber },
    BLOCK_NEIGHBOUR: (blockNumber: number) => { return 'BLOCK_NEIGHBOUR' + blockNumber },
    BLOCK_TX: (blockID: string) => { return 'BLOCK_TX' + blockID },
    TX: (txID: string) => { return 'TX' + txID },
    TX_TRANSFER: (txID: string) => { return 'TX_TRANSFER' + txID },
}

export const isNonReversible = (blockNum: number) => {
    const best = cache.get(keys.LATEST) as number

    if (best) {
        if (best - blockNum >= REVERSIBLE_WINDOW) {
            return true
        }
    }
    return false
}
