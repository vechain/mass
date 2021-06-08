import { HttpError } from 'express-toolbox'
import { isUInt } from '../validator'

export const MAX_LIMIT = 50
export const MAX_OFFSET = 50000
export const DEFAULT_LIMIT = 20
export const BLOCK_INTERVAL = 10
export const REVERSIBLE_WINDOW = 12
export const ENERGY_GROWTH_RATE = BigInt(5000000000)
export const AssetLiterals =  [  'VET', 'VTHO', 'PLA', 'SHA', 'EHrT', 'DBET', 'TIC', 'OCE', 'SNK', 'JUR', 'AQD', 'YEET', 'HAI', 'MDN', 'VEED']

export const parseLimit = (limit: string, maximum=MAX_LIMIT):number => {
    const num = parseInt(limit)
    if (isNaN(num)||!isUInt(num)||!num) { 
        throw new HttpError(400, 'invalid limit')
    }
    if (num > maximum) {
        throw new HttpError(403, 'limit too large')
    }
    return num
}

export const parseOffset = (offset: string, maximum=MAX_OFFSET): number => {
    const num = parseInt(offset)
    if (isNaN(num)||!isUInt(num)) { 
        throw new HttpError(400, 'invalid offset')
    }
    if (num > maximum) {
        throw new HttpError(403, 'offset too large')
    }
    return num
}

export const blockIDtoNum = (blockID: string) => {
    if (typeof blockID === 'string' && !/^0x[0-9a-fA-f]{64}$/i.test(blockID)) {
        throw new Error('bytes32 required as param but got: ' + blockID)
    }

    return parseInt(blockID.slice(0, 10), 16)
}

export const sanitizeHex = (val: string) => {
    if (val.startsWith('0x')) {
        val = val.slice(2)
    }
    if (val.length % 2) {
        val = '0' + val
    }
    return val
}

export const hexToBuffer = (val: string) => {
    if ( !/^0x[0-9a-fA-f]+/i.test(val)) {
        throw new Error('hex string required as param but got: ' + val)
    }

    return Buffer.from(sanitizeHex(val), 'hex')
}
