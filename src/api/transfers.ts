import { Router } from 'express'
import { try$, HttpError } from 'express-toolbox'
import { isUInt } from '../utils'
import { getRecentTransfers } from '../db-service/transfer'
import { getAssetDecimals, getAssetSymbol } from '../token'

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
    const raw = await getRecentTransfers(limit)

    const transfers = raw.filter(x => {
        return getAssetSymbol(x.asset) !== 'N/A'
    }).map(x => {
        const symbol= getAssetSymbol(x.asset)
        return {
            ...x,
            symbol: symbol,
            decimals: getAssetDecimals(symbol),
            meta: {
                blockID: x.blockID,
                blockNumber: x.block.number,
                blockTimestamp: x.block.timestamp,
                ...x.moveIndex
            },
            type: undefined,
            asset: undefined,
            moveIndex: undefined,
            id: undefined,
            blockID: undefined,
            block:undefined
        }
    })

    res.json({transfers})
}))
