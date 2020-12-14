import { Router } from 'express'
import { try$, HttpError } from 'express-toolbox'
import { isHexBytes, isUInt } from '../validator'
import { AssetType } from '../explorer-db/types'
import { getRecentTransactions, getTransaction } from '../db-service/transaction'
import { getTransferByTX } from '../db-service/transfer'
import { getPendingTx } from '../thor'

const router = Router()
export = router

router.get('/recent', try$(async (req, res) => { 
    let limit = 12
    if (req.query.limit) {
        const num = parseInt(req.query.limit)
        if (isNaN(num)||!isUInt(num) || !num || num>50) { 
            throw new HttpError(400, 'invalid limit')
        }
        limit = num
    }
    const raw = await getRecentTransactions(limit)
    const txs = raw.map(x => {
        const tx=x.transaction
        return {
            txID: x.txID,
            chainTag: tx.chainTag,
            blockRef: tx.blockRef,
            expiration: tx.expiration,
            gasPriceCoef: tx.gasPriceCoef,
            gas: tx.gas,
            nonce: tx.nonce,
            dependsOn: tx.dependsOn,
            origin: tx.origin,
            delegator: tx.delegator,
            clauses: tx.clauses,
            size: tx.size,
            receipt: {
                reverted: tx.reverted
            },
            meta: {
                blockID: x.blockID,
                blockNumber: x.block.number,
                blockTimestamp: x.block.timestamp,
                txIndex: x.seq.txIndex
            }
        }
    })
    res.json({txs})
}))

router.get('/:txid', try$(async (req, res) => {
    if (!isHexBytes(req.params.txid, 32)) {
        throw new HttpError(400, 'invalid id: bytes32 required')
    }
    const txid = req.params.txid
    const tx = await getTransaction(txid)
    if (!tx) {
        const pending = await getPendingTx(txid)
        if (pending) {
            return res.json({
                meta: null,
                tx: pending,
                receipt: null,
                transfers:[]
            })
        }
        return res.json({
            meta: null,
            tx: null,
            receipt: null,
            transfers:[]
        })
    }

    const raw = await getTransferByTX(tx)
    const transfers = raw.map(x => {
        return {
            ...x,
            symbol: AssetType[x.asset],
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
}))
