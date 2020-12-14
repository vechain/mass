import { Block } from '../explorer-db/entity/block'
import { getConnection, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { cache, keys, isNonReversible } from './cache'
import { BLOCK_INTERVAL, blockIDtoNum } from '../utils'
import { TransactionMeta } from '../explorer-db/entity/tx-meta'
import { BranchTransaction } from '../explorer-db/entity/branch-transaction'

const now = () => {
    return Math.floor(new Date().getTime()/1000)
}

export interface Neighbour {
    prev: string|null
    next: string|null
}

export const getBest = async () => {
    if (cache.has(keys.BEST)) {
        return cache.get(keys.BEST) as Block
    }
    const b = (await getConnection()
        .getRepository(Block)
        .findOne({
            where: { isTrunk: true },
            order: {id: 'DESC'}
        }))!
    
    const gap = now() - b.timestamp
    if (gap >= 0 && gap < BLOCK_INTERVAL) {
        cache.set(keys.BEST, b, (BLOCK_INTERVAL-gap)*1000)
    }
    cache.set(keys.LATEST, b.number)

    return b 
}

export const getRecentBlocks = (limit: number) => {
    return getConnection()
        .getRepository(Block)
        .find({
            where: { isTrunk: true },
            order: { id: 'DESC' },
            take: limit
        })
}

export const getBlockByID = async (blockID: string) => {
    const key = keys.BLOCK_BY_ID(blockID)
    if (cache.has(key)) {
        return cache.get(key) as Block
    }

    const b = await getConnection()
        .getRepository(Block)
        .findOne({ id: blockID })
    
    if (!b) {
        return b
    }

    if (isNonReversible(b.number)) {
        cache.set(key, b)
        if (b.isTrunk === true) {
            cache.set(keys.BLOCK_BY_NUMBER(b.number), b)
        }
    }
    return b
}

export const getBlockByNumber = async (num: number) => {
    const key = keys.BLOCK_BY_NUMBER(num)
    if (cache.has(key)) {
        return cache.get(key) as Block
    }

    const b = await getConnection()
        .getRepository(Block)
        .findOne({ number: num, isTrunk: true })
    
    if (!b) {
        return b
    }
    
    if (isNonReversible(b.number)) {
        cache.set(keys.BLOCK_BY_ID(b.id), b)
        cache.set(key, b)
    }
    return b  
}


export const getBlockNeighbourInTrunk = async (num: number) => {
    const key = keys.BLOCK_NEIGHBOUR(num)
    if (cache.has(key)) {
        return cache.get(key) as Neighbour
    }

    const nei: Neighbour = {prev:null, next: null}

    if (num === 0) {
        const block = await getConnection()
            .getRepository(Block)
            .findOne({
                where: { number: 1, isTrunk: true },
                select: ['id']
            })
        nei.next = block!.id
    } else {
        const blocks = await getConnection()
            .getRepository(Block)
            .find({
                where: { number: In([num-1, num+1]), isTrunk: true },
                select: ['id']
            })
        nei.prev = blocks[0].id
        if (blocks.length === 2) {
            nei.next = blocks[1]!.id
        }
    }

    if (isNonReversible(num)) {
        cache.set(key, nei)
    }
    return nei
}

export const getBlockTransactions = async (blockID: string) => {
    const key = keys.BLOCK_TX(blockID)
    if (cache.has(key)) {
        return cache.get(key) as TransactionMeta[]
    }

    const txs = getConnection()
        .getRepository(TransactionMeta)
        .find({
            where: { blockID },
            order: { seq: 'ASC' },
            relations: ['transaction']
        })

    if (isNonReversible(blockIDtoNum(blockID))) {
        cache.set(key, txs)
    }
    return txs
}

export const getBranchBlockTransactions = async (blockID: string) => {
    const conn = getConnection()
    const txs = await conn
        .getRepository(BranchTransaction)
        .find({
            where: { blockID },
            order: {seq: 'ASC'}
        })
    
    return txs
}

// if lessThan = true, returns the highest block whose timestamp <= ts
// if lessThan = false, returns the lowest block whose timestamp >= ts
export const getBlockByTime = (ts: number, lessThan=true) => {
    if (lessThan) {
        return getConnection()
            .getRepository(Block)
            .findOne({
                timestamp: LessThanOrEqual(ts)
            }, {
                order: { timestamp: 'DESC' }
            })
    } else {
        return getConnection()
            .getRepository(Block)
            .findOne({
                timestamp: MoreThanOrEqual(ts)
            }, {
                order: { timestamp: 'ASC' }
            })
    }
}
