import { Router } from 'express'
import { try$, HttpError } from 'express-toolbox'
import { Block } from '../explorer-db/entity/block'
import { getBest, getBlockByID, getBlockTransactions, getRecentBlocks, getBlockNeighbourInTrunk, getBlockByNumber, getBranchBlockTransactions } from '../db-service/block'
import { parseLimit, DEFAULT_LIMIT, isHexBytes, isUInt } from '../utils'

const router = Router()
export = router

router.get('/recent', try$(async (req, res) => {
    const limit = req.query.limit ? parseLimit(req.query.limit) : DEFAULT_LIMIT

    const blocks = await getRecentBlocks(limit)
    res.json({blocks})
}))

router.get('/best', try$(async (req, res) => {
    const best = await getBest()
    res.json({block:best, prev: best.parentID, next:null})
}))

router.get('/:revision', try$(async (req, res) => {
    let b: {block: Block, prev: string|null, next: string|null}
    if (req.params.revision.startsWith('0x')) {
        if (!isHexBytes(req.params.revision, 32)) {
            throw new HttpError(400, 'invalid revision: bytes32 or number or best required')
        }
        const ret = await getBlockByID(req.params.revision)
        if (!ret) {
            return res.json({ block: null, prev: null, next: null })
        }
        const nei = await getBlockNeighbourInTrunk(ret.number)
        b = { block: ret, prev:nei.prev, next:nei.next }
    } else {
        const num = parseInt(req.params.revision)
        if (isNaN(num) || !isUInt(num)) {
            throw new HttpError(400, 'invalid revision: bytes32 or number or best required')
        }
        const ret = await getBlockByNumber(num)
        if (!ret) {
            return res.json({ block: null, prev: null, next: null })
        }
        const nei = await getBlockNeighbourInTrunk(ret.number)
        b =  { block: ret, prev:nei.prev, next:nei.next }
    }
    res.json(b)
}))

router.get('/:blockid/transactions', try$(async (req, res) => {
    if (!isHexBytes(req.params.blockid, 32)) {
        throw new HttpError(400, 'invalid id: bytes32 required')
    }
    const blockID = req.params.blockid
    const block = (await getBlockByID(blockID))
    if (!block) {
        return res.json({meta: null, txs: []})
    }

    if (block.txCount === 0) {
        return res.json({
            txs:[],
            meta: {
                blockID: block.id,
                blockNumber: block.number,
                blockTimestamp: block.timestamp
            }
        })
    }

    if (block.isTrunk) {
        const raw = await getBlockTransactions(blockID)
        return res.json({
            txs: raw.map(x => {
                const tx = x.transaction
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
                    }
                }
            }),
            meta: {
                blockID: block.id,
                blockNumber: block.number,
                blockTimestamp: block.timestamp
            }
        })
    } else {
        const raw = await getBranchBlockTransactions(blockID)
        return res.json({
            txs: raw.map(tx => {
                return {
                    txID: tx.txID,
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
                    }
                }
            }),
            meta: {
                blockID: block.id,
                blockNumber: block.number,
                blockTimestamp: block.timestamp
            }
        })
    }    
}))
