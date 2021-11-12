import *  as LRU from 'lru-cache'
import { getConnection } from 'typeorm'
import { Transaction } from '../local-store/entities/transaction'
import * as thor from '../thor'
import { getBest } from './block'
import { isNonReversible } from './cache'
import { getTransaction } from './transaction'

type PendingTransactionWithState = Omit<thor.PendingTransaction, 'meta'> & { state: string }
enum PendingState {
    PENDING = 'PENDING',
    EXPIRED = 'EXPIRED',
    DEP_REVERTED = 'DEP REVERTED',
}

const cache = new LRU<string, PendingTransactionWithState>(1024)

export const getPending = async (txID: string): Promise<PendingTransactionWithState | null> => {
    let tx: PendingTransactionWithState | null = null
    if (cache.has(txID)) {
        tx = cache.get(txID)!

        if (tx.state !== PendingState.PENDING) {
            return tx
        }
    }

    const repo = getConnection('local').getRepository(Transaction)
    if (!tx) {
        const t1 = await repo.findOne({ txID })
        if (t1) {
            tx = { ...t1.body, state: t1.state }
            if (tx.state !== PendingState.PENDING) {
                cache.set(txID, tx)
                return tx
            }
        } 
    }

    if(!tx){
        const t2 = await thor.getPendingTx(txID)
        if (t2) {
            // omit 'meta' from tx
            // if meta was not null, means tx is packed but not loaded to db
            // in that case, consider it's still pending, in db's view
            const {meta, ...t3} = t2
            await repo.insert({
                txID,
                body: t3,
                state: PendingState.PENDING
            })

            tx = { ...t3, state: PendingState.PENDING }
            cache.set(txID, tx)
            return tx
        }
    }

    if (!tx) {
        return tx
    }

    await updateStatus(tx)
    return tx

}

const updateStatus = async (tx: PendingTransactionWithState): Promise<void> => {
    const best = await getBest()
    const ref = parseInt(tx.blockRef.slice(0, 10), 16)
    const repo = getConnection('local').getRepository(Transaction)

    if (tx.dependsOn !== null) {
        const dep = await getTransaction(tx.dependsOn)

        if (!!dep && dep.transaction.reverted) {
            tx.state = PendingState.DEP_REVERTED

            if (isNonReversible(dep.block.number)) {
                await repo.update({ txID: tx.id }, { state: PendingState.DEP_REVERTED })
                cache.set(tx.id, tx)
            }
        }
    }

    if (ref + tx.expiration < best.number) {
        tx.state = PendingState.EXPIRED
        if (isNonReversible(ref + tx.expiration)) {
            await repo.update({ txID: tx.id }, { state: PendingState.EXPIRED })
            cache.set(tx.id, tx)
        }
    }

    return
}
