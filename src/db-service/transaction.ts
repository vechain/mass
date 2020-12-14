import { getConnection, In } from 'typeorm'
import { cache, isNonReversible, keys } from './cache'
import { blockIDtoNum } from '../utils'
import { AggregatedTransaction } from '../explorer-db/entity/aggregated-tx'
import { MoveType } from '../explorer-db/types'
import { TransactionMeta } from '../explorer-db/entity/tx-meta'

export const getTransaction = async (txID: string) => {
    const key = keys.TX(txID)
    if (cache.has(key)) {
        return cache.get(key) as TransactionMeta
    }

    const tx = await getConnection()
        .getRepository(TransactionMeta)
        .findOne({
            where:{txID},
            relations: ['transaction', 'block']
        })
    
    if (!tx) {
        return tx
    }

    if (isNonReversible(blockIDtoNum(tx.blockID))) {
        cache.set(key, tx)
    }
    return tx
}

export const getRecentTransactions = async (limit: number) => {
    const conn = getConnection()
    const ids = await conn
        .getRepository(TransactionMeta)
        .find({
            select: ['txID'],
            order: { seq: 'DESC' },
            take: limit,
        })
    
    if (!ids.length) {
        return []
    }

    const txs = await conn
        .getRepository(TransactionMeta)
        .find({
            where: { txID: In(ids.map(x => x.txID)) },
            order: { seq: 'DESC' },
            relations: ['transaction', 'block']
        })
    return txs
}

export const countAccountTransaction = (addr: string) => {
    return getConnection()
        .getRepository(AggregatedTransaction)
        .count({participant: addr})
}

export const getAccountTransaction = async (addr: string, offset: number, limit: number) => {
    const conn = getConnection()
    const ids = await conn
        .getRepository(AggregatedTransaction)
        .find({
            select: ['id'],
            where: { participant: addr },
            take: limit,
            skip: offset,
            order: { seq: 'DESC' }
        })
    if (!ids.length) {
        return []
    }
    const txs = await conn
        .getRepository(AggregatedTransaction)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'DESC'},
            relations:['block', 'transaction']
        })
    return txs
}

export const countAccountTransactionByType = (addr: string, type: MoveType) => {
    return getConnection()
        .getRepository(AggregatedTransaction)
        .count({participant: addr, type: In([MoveType.Self, type])})
}

export const getAccountTransactionByType = async (
    addr: string,
    type: MoveType,
    offset: number,
    limit: number
) => {
    const conn = getConnection()
    const ids = await conn
        .getRepository(AggregatedTransaction)
        .find({
            select: ['id'],
            where: { participant: addr, type: In([MoveType.Self, type]) },
            take: limit,
            skip: offset,
            order: { seq: 'DESC' }
        })
    if (!ids.length) {
        return []
    }
    const txs = await conn
        .getRepository(AggregatedTransaction)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'DESC'},
            relations:['block', 'transaction']
        })
    return txs
}
