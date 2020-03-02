import { Router } from 'express'
import { try$, HttpError } from 'express-toolbox'
import { isHexBytes } from '../validator'
import { getAccount, getTokenBalance, countAccountTransaction, getAccountTransaction, getAccountTransfer, getAccountTransferByType, countAccountTransferByType, countAccountTransfer } from '../db-service/account'
import { getAuthority, getSignedBlocks } from '../db-service/authority'
import { AssetType, MoveDirection } from '../explorer-db/types'
import { parseOffset, parseLimit, DEFAULT_LIMIT, BLOCK_INTERVAL, ENERGY_GROWTH_RATE, AssetLiterals } from '../utils'

const router = Router()
export = router

router.get('/:address', try$(async (req, res) => {
    if (!isHexBytes(req.params.address, 20)) {
        throw new HttpError(400, 'invalid address')
    }
    const addr = req.params.address
    let account = await getAccount(addr)
    const t = await getTokenBalance(addr)
    const authority = await getAuthority(addr)
    if (!account) {
        account = {
            address: addr,
            balance: BigInt(0),
            energy: BigInt(0),
            blockTime: 0,
            txCount: 0,
            code: null,
            master: null,
            sponsor: null,
            firstSeen: 0,
            alias: null,
        }
    }
    const tokens: Array<{symbol:string, balance:bigint}> = []
    for (let x of t) {
        tokens.push({ symbol: AssetType[x.type], balance: x.balance })
    }
    
    const ts = Math.floor(new Date().getTime()/1000)
    const lastBlockTime = ts - ts % BLOCK_INTERVAL

    account.energy = account.energy + account.balance * BigInt(lastBlockTime - account.blockTime) * ENERGY_GROWTH_RATE/BigInt(1e18)
    
    res.json({
        account: {
            ...account,
            blockTime: undefined,
            firstSeen: undefined,
            alias: undefined
        } ,
        tokens,
        authority: authority ? {...authority, id: undefined} : null
    })
}))

router.get('/:address/transactions', try$(async (req, res) => {
    if (!isHexBytes(req.params.address, 20)) {
        throw new HttpError(400, 'invalid address')
    }
    const addr = req.params.address
    const offset = req.query.offset ? parseOffset(req.query.offset) : 0
    const limit = req.query.limit ? parseLimit(req.query.limit) : DEFAULT_LIMIT

    const count = await countAccountTransaction(addr)
    if (!count || count <= offset) {
        return res.json({ count, txs: [] })
    }
    const raw = await getAccountTransaction(addr, offset, limit)
    const txs = raw.map(x => {
        return {
            ...x,
            receipt: {
                reverted: x.receipt.reverted
            },
            meta: {
                blockID: x.blockID,
                blockNumber: x.block.number,
                blockTimestamp: x.block.timestamp
            },
            block: undefined,
            blockID: undefined
        }
    })

    res.json({count, txs})
}))

router.get('/:address/transfers', try$(async (req, res) => {
    if (!isHexBytes(req.params.address, 20)) {
        throw new HttpError(400, 'invalid address')
    }
    const addr = req.params.address
    const offset = req.query.offset ? parseOffset(req.query.offset) : 0
    const limit = req.query.limit ? parseLimit(req.query.limit) : DEFAULT_LIMIT

    let type: AssetType|null = null
    if (req.query.type) {
        if (AssetLiterals.indexOf(req.query.type) === -1) {
            throw new HttpError(400, 'invalid type')
        }
        type = AssetType[req.query.type as keyof typeof AssetType]
    }

    if (type === null) {
        const count = await countAccountTransfer(addr)
        if (!count || count <= offset) {
            return res.json({count, transfers:[]})
        }
        const raw = await getAccountTransfer(addr, offset, limit)
        const transfers = raw.map(x => {
            return {
                ...x.movement,
                symbol: AssetType[x.type],
                direction: MoveDirection[x.direction],
                type: undefined,
                meta: {
                    blockID: x.movement.blockID,
                    blockNumber: x.movement.block.number,
                    blockTimestamp: x.movement.block.timestamp
                },
                block: undefined,
                blockID: undefined,
                id: undefined
            }
        })
        res.json({count,transfers})
    } else {
        const count = await countAccountTransferByType(addr, type)
        if (!count || count <= offset) {
            return res.json({count, transfers:[]})
        }
        const raw = await getAccountTransferByType(addr, type, offset, limit)
        const transfers = raw.map(x => {
            return {
                ...x.movement,
                symbol: AssetType[x.type],
                direction: MoveDirection[x.direction],
                type: undefined,
                meta: {
                    blockID: x.movement.blockID,
                    blockNumber: x.movement.block.number,
                    blockTimestamp: x.movement.block.timestamp
                },
                block:undefined,
                blockID: undefined,
                id: undefined
            }
        })
        res.json({count,transfers})
    }
}))

router.get('/:address/signed', try$(async (req, res) => {
    if (!isHexBytes(req.params.address, 20)) {
        throw new HttpError(400, 'invalid address')
    }
    const addr = req.params.address
    const offset = req.query.offset ? parseOffset(req.query.offset) : 0
    const limit = req.query.limit ? parseLimit(req.query.limit) : DEFAULT_LIMIT

    const auth = await getAuthority(addr)
    if (!auth) {
        return res.json({count:0, blocks:[]})
    }

    const count = auth.signed
    if (!count || count <= offset) {
        return res.json({count, blocks:[]})
    }
    const blocks = await getSignedBlocks(addr, offset, limit)

    res.json({count, blocks})
}))
