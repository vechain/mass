import { Router } from 'express'
import { try$, HttpError } from 'express-toolbox'
import { isUInt } from '../validator'
import { getRecentTransfers } from '../db-service/transfer'
import { AssetType } from '../explorer-db/types'

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

    const transfers = raw.map(x => {
        return {
            ...x,
            symbol: AssetType[x.asset],
            type: undefined,
            id: undefined,
            blockID: undefined,
            meta: {
                blockID: x.blockID,
                blockNumber: x.block.number,
                blockTimestamp: x.block.timestamp
            },
            block:undefined
        }
    })

    res.json({transfers})
}))
