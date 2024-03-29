import { Router } from 'express'
import { try$, HttpError } from 'express-toolbox'
import { getAccount, getTokenBalance } from '../db-service/account'
import { getAuthority, getSignedBlocks } from '../db-service/authority'
import { MoveType } from '../explorer-db/types'
import { parseOffset, parseLimit, DEFAULT_LIMIT, BLOCK_INTERVAL, ENERGY_GROWTH_RATE, isHexBytes } from '../utils'
import { countAccountTransaction, getAccountTransaction, countAccountTransactionByType, getAccountTransactionByType } from '../db-service/transaction'
import { countAccountTransfer, getAccountTransfer, countAccountTransferByAsset, getAccountTransferByAsset } from '../db-service/transfer'
import { getAssetDecimals, getAssetSymbol, getAssetType, normalizeAsset } from '../token'

const router = Router()
export = router

router.get('/:address', try$(async (req, res) => {
    if (!isHexBytes(req.params.address, 20)) {
        throw new HttpError(400, 'invalid address')
    }
    const addr = req.params.address
    let [
        account,
        tokenBalance,
        authority
    ] = await Promise.all([
        getAccount(addr),
        getTokenBalance(addr),
        getAuthority(addr)
    ])

    if (!account) {
        account = {
            address: addr,
            balance: BigInt(0),
            energy: BigInt(0),
            generated: BigInt(0),
            paid: BigInt(0),
            blockTime: 0,
            code: null,
            master: null,
            sponsor: null,
            firstSeen: 0,
            alias: null,
            suicided: false,
            deployer: null,
        }
    }
    const tokens: Array<{ symbol: string, balance: bigint, decimals: number }> = []
    for (let x of tokenBalance!) {
        const symbol = getAssetSymbol(x.type)
        if (symbol!=='N/A') {
            tokens.push({ symbol: symbol, balance: x.balance, decimals: getAssetDecimals(symbol)})
        }
    }

    const ts = Math.floor(new Date().getTime() / 1000)
    const lastBlockTime = ts - ts % BLOCK_INTERVAL

    account.energy = account.energy + account.balance * BigInt(lastBlockTime - account.blockTime) * ENERGY_GROWTH_RATE / BigInt(1e18)

    res.json({
        account: {
            ...account,
            blockTime: undefined,
            firstSeen: undefined,
            alias: undefined
        },
        tokens,
        authority: authority ? { ...authority, id: undefined } : null
    })
}))

router.get('/:address/transactions', try$(async (req, res) => {
    if (!isHexBytes(req.params.address, 20)) {
        throw new HttpError(400, 'invalid address')
    }
    const addr = req.params.address
    const offset = req.query.offset ? parseOffset(req.query.offset) : 0
    const limit = req.query.limit ? parseLimit(req.query.limit) : DEFAULT_LIMIT

    let type: MoveType | null = null
    if (req.query.type) {
        if (['In', 'Out'].indexOf(req.query.type) === -1) {
            throw new HttpError(400, 'invalid type')
        }
        type = MoveType[req.query.type as keyof typeof MoveType]
    }

    if (type === null) {
        const count = await countAccountTransaction(addr)
        if (!count || count <= offset) {
            return res.json({ count, txs: [] })
        }
        const raw = await getAccountTransaction(addr, offset, limit)
        const txs = raw.map(x => {
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
                },
                meta: {
                    blockID: x.blockID,
                    blockNumber: x.block.number,
                    blockTimestamp: x.block.timestamp,
                    txIndex: x.seq.txIndex
                }
            }
        })
        res.json({ count, txs })
    } else {
        const count = await countAccountTransactionByType(addr, type)
        if (!count || count <= offset) {
            return res.json({ count, txs: [] })
        }
        const raw = await getAccountTransactionByType(addr, type, offset, limit)
        const txs = raw.map(x => {
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
                },
                meta: {
                    blockID: x.blockID,
                    blockNumber: x.block.number,
                    blockTimestamp: x.block.timestamp,
                    txIndex: x.seq.txIndex
                }
            }
        })
        res.json({ count, txs })
    }
}))

router.get('/:address/transfers', try$(async (req, res) => {
    if (!isHexBytes(req.params.address, 20)) {
        throw new HttpError(400, 'invalid address')
    }
    const addr = req.params.address
    const offset = req.query.offset ? parseOffset(req.query.offset) : 0
    const limit = req.query.limit ? parseLimit(req.query.limit) : DEFAULT_LIMIT

    let asset: string | null = null
    if (req.query.asset) {
        const ass = normalizeAsset(req.query.asset)
        if (!ass) {
            throw new HttpError(400, 'invalid asset')
        }
        asset = ass
    }

    if (asset === null) {
        const count = await countAccountTransfer(addr)
        if (!count || count <= offset) {
            return res.json({ count, transfers: [] })
        }
        const raw = await getAccountTransfer(addr, offset, limit)
        const transfers = raw.filter(x => {
            return getAssetSymbol(x.asset) !== 'N/A'
        }).map(x => {
            const symbol= getAssetSymbol(x.asset)
            return {
                ...x.movement,
                symbol: symbol,
                decimals: getAssetDecimals(symbol),
                meta: {
                    blockID: x.movement.blockID,
                    blockNumber: x.movement.block.number,
                    blockTimestamp: x.movement.block.timestamp,
                    ...x.seq.moveIndex
                },
                asset: undefined,
                type: undefined,
                moveIndex: undefined,
                block: undefined,
                blockID: undefined,
                id: undefined
            }
        })
        res.json({ count, transfers })
    } else {
        const typ = getAssetType(asset)
        const count = await countAccountTransferByAsset(addr, typ)
        if (!count || count <= offset) {
            return res.json({ count, transfers: [] })
        }
        const raw = await getAccountTransferByAsset(addr, typ, offset, limit)
        const transfers = raw.map(x => {
            const symbol = getAssetSymbol(x.asset)
            return {
                ...x.movement,
                symbol: symbol,
                decimals: getAssetDecimals(symbol),
                meta: {
                    blockID: x.movement.blockID,
                    blockNumber: x.movement.block.number,
                    blockTimestamp: x.movement.block.timestamp,
                    ...x.seq.moveIndex
                },
                asset: undefined,
                type: undefined,
                moveIndex: undefined,
                block: undefined,
                blockID: undefined,
                id: undefined
            }
        })
        res.json({ count, transfers })
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
        return res.json({ count: 0, blocks: [] })
    }

    const count = auth.signed
    if (!count || count <= offset) {
        return res.json({ count, blocks: [] })
    }
    const blocks = await getSignedBlocks(addr, offset, limit)

    res.json({ count, blocks })
}))
