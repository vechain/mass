import { getConnection, In } from 'typeorm'
import { Transaction } from '../explorer-db/entity/transaction'
import { cache, keys } from './cache'
import { REVERSIBLE_WINDOW, blockIDtoNum } from '../utils'
import { getAccount } from './account'

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

export const countAccountTransaction = async (addr: string) => {
    const acc = await getAccount(addr)
    if (!acc) {
        return 0
    } else {
        return acc.txCount
    }
}

export const getAccountTransaction = async (addr: string, offset: number, limit: number) => {
    const conn = getConnection()
    const ids = await conn
        .getRepository(Transaction)
        .find({
            select: ['txID'],
            where: { origin: addr },
            take: limit,
            skip: offset,
            order: { blockID: 'DESC', txIndex: 'DESC' }
        })
    const txs = await conn
        .getRepository(Transaction)
        .find({
            where: { txID: In(ids.map(x => x.txID)) },
            order: { blockID: 'DESC', txIndex: 'DESC' },
            relations:['block', 'receipt']
        })    
    return txs
}
