import { Router } from 'express'
import { try$ } from 'express-toolbox'
import { getBest, getRecentBlocks } from '../db-service/block'
import { getStatus, ChainStatus } from '../db-service/chain'
import { getRecentTransactions } from '../db-service/transaction'
import { Block } from '../explorer-db/entity/block'

interface Summary {
    status: ChainStatus
    blocks: Block[]
    txs: {
        txID: string;
        origin: string;
        totalValue: bigint;
        reverted: boolean;
        timestamp: number;
    }[]
}

const router = Router()
export = router

let summary: Summary|null = null
router.get('/summary', try$(async (req, res) => {
    const best = await getBest()
    if (!summary || summary.status.best !== best.id) {
        const status = await getStatus(best.id)
        const blocks = await getRecentBlocks(10)
        const txs = await getRecentTransactions(10)
        summary = { status, blocks, txs}
    }
   
    return res.json(summary)
}))

router.get('/head', try$(async (req, res) => {
    const best = await getBest()
    return res.json({
        id: best.id,
        timestamp: best.timestamp,
        parentID: best.parentID
    })
}))
