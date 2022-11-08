import { Router } from 'express'
import { try$ } from 'express-toolbox'
import { getBest, getRecentBlocks } from '../db-service/block'
import { getStatus } from '../db-service/chain'
import { getRecentTransactions } from '../db-service/transaction'

const router = Router()
export = router

router.get('/summary', try$(async (req, res) => {
    const status = await getStatus()
    const blocks = await getRecentBlocks(10)
    const txs = await getRecentTransactions(10)
    res.json({status, blocks, txs})
}))

router.get('/head', try$(async (req, res) => {
    const best = await getBest()
    return res.json({
        id: best.id,
        timestamp: best.timestamp,
        parentID: best.parentID
    })
}))
