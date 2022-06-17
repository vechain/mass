import { getConnection, In, Between } from 'typeorm'
import { keys, cache, isNonReversible, agedCache } from './cache'
import { blockIDtoNum } from '../utils'
import { AssetMovement } from '../explorer-db/entity/movement'
import { AggregatedMovement } from '../explorer-db/entity/aggregated-move'
import { TransactionMeta } from '../explorer-db/entity/tx-meta'
import { AssetType } from '../types'

export const getRecentTransfers = (limit: number) => {
    return getConnection()
        .getRepository(AssetMovement)
        .createQueryBuilder('asset')
        .orderBy({ blockID: 'DESC', moveIndex: 'DESC' })
        .limit(limit)
        .leftJoinAndSelect('asset.block', 'block')
        .getMany()
}

export const getTransferByTX = async (tx: TransactionMeta) => {
    const { txID } = tx
    const key = keys.TX_TRANSFER(txID)
    if (cache.has(key)) {
        return cache.get(key) as AssetMovement[]
    }

    const transfers = await getConnection()
        .getRepository(AssetMovement)
        .find({
            where: { txID },
            order: { moveIndex: 'ASC' }
        })

    if (isNonReversible(blockIDtoNum(tx.blockID))) {
        cache.set(key, transfers)
    }
    return transfers
}

export const countAccountTransfer = async (addr: string) => {
    const key = keys.TRANSFER_COUNT(addr, 'ALL')
    if (agedCache.has(key)) {
        return agedCache.get(key) as number
    }

    const count = await getConnection()
        .getRepository(AggregatedMovement)
        .count({ participant: addr })

    if (count >= 50000) {
        agedCache.set(key, count)
    }
    return count
}

export const getAccountTransfer = async (addr: string, offset: number, limit: number) => {
    const conn = getConnection()

    const ids = await conn
        .getRepository(AggregatedMovement)
        .find({
            select: ['id'],
            where: { participant: addr },
            order: { seq: 'DESC' },
            take: limit,
            skip: offset
        })

    if (!ids.length) {
        return []
    }

    const aggregated = await conn
        .getRepository(AggregatedMovement)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'DESC' },
            relations: ['movement', 'movement.block']
        })

    return aggregated
}

export const countAccountTransferByAsset = async (addr: string, asset: AssetType) => {
    const key = keys.TRANSFER_COUNT(addr, AssetType[asset])
    if (agedCache.has(key)) {
        return agedCache.get(key) as number
    }

    const count = await getConnection()
        .getRepository(AggregatedMovement)
        .count({ participant: addr, asset })

    if (count >= 50000) {
        agedCache.set(key, count)
    }

    return count
}

export const getAccountTransferByAsset = async (
    addr: string,
    asset: AssetType,
    offset: number,
    limit: number
) => {
    const conn = getConnection()

    const ids = await conn
        .getRepository(AggregatedMovement)
        .find({
            select: ['id'],
            where: { participant: addr, asset },
            order: { seq: 'DESC' },
            take: limit,
            skip: offset
        })

    if (!ids.length) {
        return []
    }

    const aggregated = await conn
        .getRepository(AggregatedMovement)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'DESC' },
            relations: ['movement', 'movement.block']
        })

    return aggregated
}

export const getAccountTransferByRange = async (addr: string, fromBlock: number, toBlock: number, limit = 5000) => {
    const conn = getConnection()

    const ids = await conn
        .getRepository(AggregatedMovement)
        .find({
            select: ['id'],
            where: {
                participant: addr,
                seq: Between({
                    blockNumber: fromBlock,
                    moveIndex: { txIndex: 0, clauseIndex: 0, logIndex: 0 }
                }, {
                    blockNumber: toBlock,
                    moveIndex: { txIndex: 65535, clauseIndex: 0, logIndex: 0 }
                })
            },
            order: { seq: 'ASC' },
            take: limit,
        })

    if (!ids.length) {
        return []
    }
    const aggregated = await conn
        .getRepository(AggregatedMovement)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'ASC' },
            relations: ['movement', 'movement.block', 'movement.transaction']
        })

    return aggregated
}

