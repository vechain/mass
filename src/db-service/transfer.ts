import { getConnection, In } from 'typeorm'
import { AssetMovement } from '../explorer-db/entity/movement'
import { keys, cache } from './cache'
import { Transaction } from '../explorer-db/entity/transaction'
import { blockIDtoNum, REVERSIBLE_WINDOW } from '../utils'
import { AggregatedMovement } from '../explorer-db/entity/aggregated-move'
import { AssetType } from '../explorer-db/types'

export const getRecentTransfers = (limit: number) => {
    return getConnection()
        .getRepository(AssetMovement)
        .createQueryBuilder('asset')
        .orderBy({ blockID: 'DESC', moveIndex: 'DESC' })
        .limit(limit)
        .leftJoinAndSelect('asset.block', 'block')
        .getMany()
}

export const getTransferByTX = async (tx: Transaction) => {
    const { txID } =  tx
    const key = keys.TX_TRANSFER(txID)
    if (cache.has(key)) {
        return cache.get(key) as AssetMovement[]
    }

    const transfers = await getConnection()
        .getRepository(AssetMovement)
        .find({
            where: { txID },
            order: {moveIndex: 'ASC'}
        })
    
    const best = cache.get(keys.LAST_BEST) as number
    if (best) {
        if (best - blockIDtoNum(tx.blockID) >= REVERSIBLE_WINDOW) {
            cache.set(key, transfers)
        }
    }
    return transfers
}

export const countAccountTransfer = (addr: string) => {
    return getConnection()
        .getRepository(AggregatedMovement)
        .count({participant: addr})
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
    
    const aggregated = await conn
        .getRepository(AggregatedMovement)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'DESC' },
            relations:[ 'movement', 'movement.block' ]
        })
    
    return aggregated
}

export const countAccountTransferByAsset = (addr: string, asset: AssetType) => {
    return getConnection()
        .getRepository(AggregatedMovement)
        .count({participant: addr, asset})
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
    
    const aggregated = await conn
        .getRepository(AggregatedMovement)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'DESC' },
            relations:[ 'movement', 'movement.block' ]
        })
    
    return aggregated
}
