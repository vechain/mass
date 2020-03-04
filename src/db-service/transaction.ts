import { getConnection, In } from 'typeorm'
import { Transaction } from '../explorer-db/entity/transaction'
import { cache, keys } from './cache'
import { REVERSIBLE_WINDOW, blockIDtoNum } from '../utils'
import { AggregatedTransaction } from '../explorer-db/entity/aggregated-tx'
import { MoveType } from '../explorer-db/types'

export const getTransactionWithMeta = async (txID: string) => {
    const key = keys.TX(txID)
    if (cache.has(key)) {
        return cache.get(key) as Transaction
    }

    const tx = await getConnection()
        .getRepository(Transaction)
        .createQueryBuilder('tx')
        .where({ txID })
        .leftJoinAndSelect('tx.block', 'block')
        .leftJoinAndSelect('tx.receipt', 'receipt')
        .getOne()
    
    if (!tx) {
        return tx
    }

    const best = cache.get(keys.LAST_BEST) as number
    if (best) {
        if (best - blockIDtoNum(tx.blockID) >= REVERSIBLE_WINDOW) {
            cache.set(key, tx)
        }
    }

    return tx
}

export const getRecentTransactions = (limit: number) => {
    return getConnection()
        .getRepository(Transaction)
        .createQueryBuilder('tx')
        .orderBy({ 'tx.blockID': 'DESC', 'tx.txIndex': 'DESC' })
        .limit(limit)
        .leftJoinAndSelect('tx.block', 'block')
        .leftJoinAndSelect('tx.receipt', 'receipt')
        .getMany()
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
    const txs = await conn
        .getRepository(AggregatedTransaction)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'DESC'},
            relations:['block', 'transaction', 'receipt']
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
    const txs = await conn
        .getRepository(AggregatedTransaction)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'DESC'},
            relations:['block', 'transaction', 'receipt']
        })
    return txs
}
