import *  as LRU from 'lru-cache'
import { getConnection } from 'typeorm'
import { Transaction } from '../local-store/entities/transaction'
import { getPendingTx, PendingTransaction } from '../thor'

const cache = new LRU<string, PendingTransaction>(1024)
export const getPending = async (txID: string): Promise<PendingTransaction | null> => {
    if (cache.has(txID)){
        return cache.get(txID)!
    }

    const repo = getConnection('local').getRepository(Transaction)
    const tx = await repo.findOne({txID})
    if (tx) {
        cache.set(txID, tx.body)
        return tx.body
    }

    const chainTx = await getPendingTx(txID)
    if (chainTx) {
        cache.set(txID, chainTx)
        await repo.insert({
            txID,
            body: chainTx
        })
        return chainTx
    }

    return null
}

