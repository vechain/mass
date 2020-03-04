import { Router } from 'express'
import { try$, HttpError } from 'express-toolbox'
import { isHexBytes, isUInt } from '../validator'
import { getTransactionWithMeta, getRecentTransactions } from '../db-service/transaction'
import { AssetType } from '../explorer-db/types'
import { getTransferByTX } from '../db-service/transfer'

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
        return {
            meta: {
                blockID: x.blockID,
                blockNumber: x.block.number,
                blockTimestamp: x.block.timestamp
            },
            ...x,
            receipt: {
                reverted: x.receipt.reverted
            },
            blockID: undefined,
            block: undefined
        }
    })
    res.json({txs})
}))

router.get('/:txid', try$(async (req, res) => {
    if (!isHexBytes(req.params.txid, 32)) {
        throw new HttpError(400, 'invalid id: bytes32 required')
    }
    const txid = req.params.txid
    const tx = await getTransactionWithMeta(txid)
    if (!tx) {
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
            type: undefined,
            blockID: undefined,
            id: undefined
        }
    })

    res.json({
        meta: {
            blockID: tx.blockID,
            blockNumber: tx.block.number,
            blockTimestamp: tx.block.timestamp
        },
        tx:{...tx, block: undefined, blockID: undefined, receipt: undefined},
        receipt:{...tx.receipt, blockID: undefined},
        transfers
    })
}))
