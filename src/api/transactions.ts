import { Router } from 'express'
import { try$, HttpError } from 'express-toolbox'
import { isHexBytes, isUInt } from '../utils'
import { getRecentTransactions, getTransaction } from '../db-service/transaction'
import { getTransferByTX } from '../db-service/transfer'
import { getPending } from '../db-service/pending'
import { getAssetDecimals, getAssetSymbol } from '../token'

const router = Router()
export = router

router.get('/recent', try$(async (req, res) => {
    let limit = 12
    if (req.query.limit) {
        const num = parseInt(req.query.limit)
        if (isNaN(num) || !isUInt(num) || !num || num > 50) {
            throw new HttpError(400, 'invalid limit')
        }
        limit = num
    }
    const txs = await getRecentTransactions(limit)
    res.json({ txs })
}))

router.get('/:txid', try$(async (req, res) => {
    if (!isHexBytes(req.params.txid, 32)) {
        throw new HttpError(400, 'invalid id: bytes32 required')
    }
    const txid = req.params.txid
    const tx = await getTransaction(txid)
    if (tx) {
        const raw = await getTransferByTX(tx)
        const transfers = raw.filter(x => {
            return getAssetSymbol(x.asset) !== 'N/A'
        }).map(x => {
            const symbol = getAssetSymbol(x.asset)
            return {
                ...x,
                symbol: symbol,
                decimals: getAssetDecimals(symbol),
                meta: { ...x.moveIndex },
                moveIndex: undefined,
                asset: undefined,
                type: undefined,
                blockID: undefined,
                id: undefined
            }
        })

        res.json({
            tx: {
                txID: tx.txID,
                chainTag: tx.transaction.chainTag,
                blockRef: tx.transaction.blockRef,
                expiration: tx.transaction.expiration,
                gasPriceCoef: tx.transaction.gasPriceCoef,
                gas: tx.transaction.gas,
                nonce: tx.transaction.nonce,
                dependsOn: tx.transaction.dependsOn,
                origin: tx.transaction.origin,
                delegator: tx.transaction.delegator,
                clauses: tx.transaction.clauses,
                size: tx.transaction.size,
            },
            receipt: {
                txID: tx.txID,
                gasUsed: tx.transaction.gasUsed,
                gasPayer: tx.transaction.gasPayer,
                paid: tx.transaction.paid,
                reward: tx.transaction.reward,
                reverted: tx.transaction.reverted,
                outputs: tx.transaction.outputs,
                // revert reason will be present when OP_REVERT with message, error will be 'execution reverted'
                vmError: tx.transaction.vmError
            },
            transfers,
            meta: {
                blockID: tx.blockID,
                blockNumber: tx.block.number,
                blockTimestamp: tx.block.timestamp
            },
        })
        return
    }

    if (!tx) {
        const pending = await getPending(txid)
        if (pending) {
            res.json({
                meta: null,
                tx: { ...pending, txID: pending.id, id: undefined },
                receipt: null,
                transfers: []
            })
            return
        }
        res.json({
            meta: null,
            tx: null,
            receipt: null,
            transfers: []
        })
        return
    }

}))
