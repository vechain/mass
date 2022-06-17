import { Router } from 'express'
import { try$, HttpError } from 'express-toolbox'
import { isHexBytes, isDate, getTokenDecimals } from '../utils'
import { getBlockByTime } from '../db-service/block'
import { getAccountTransferByRange } from '../db-service/transfer'
import { MoveType } from '../explorer-db/types'
import BigNumber from 'bignumber.js'
import { AggregatedMovement } from '../explorer-db/entity/aggregated-move'
import { AssetType } from '../types'

const router = Router()
export = router

router.post('/transfers/:address', try$(async (req, res) => {
    if (!isHexBytes(req.params.address, 20)) {
        throw new HttpError(400, 'invalid address')
    }
    if (!isDate(req.body.from)) {
        throw new HttpError(400, 'invalid from')
    }
    if (!isDate(req.body.to)) {
        throw new HttpError(400, 'invalid to')
    }
    const addr = req.params.address
    const from = Date.parse(req.body.from) / 1000
    const to = Date.parse(req.body.to) / 1000 + 24 * 60 * 60 - 10

    const fromBlock = await getBlockByTime(from, false)
    const toBlock = await getBlockByTime(to, true)
    const transfers = await getAccountTransferByRange(addr, fromBlock!.number, toBlock!.number, 5000)

    const tableHead = ['Txid', 'Block# ', 'Date(GMT)', 'Sender', 'Recipient', 'Amount', 'Token', 'Fee', 'Remark']
    const tableBody: any[] = [tableHead]

    const fromWei = (val: bigint) => {
        return new BigNumber(val.toString()).div(new BigNumber(1e18)).toString()
    }

    const toSymbol = (tr: AggregatedMovement) => {
        let decimals:number
        if (tr.asset === AssetType.VET || tr.asset === AssetType.VTHO) {
            decimals = 18
        } else {
            decimals = getTokenDecimals(AssetType[tr.asset] as keyof typeof AssetType)
        }
        return new BigNumber(tr.movement.amount.toString()).div(new BigNumber(10).pow(decimals)).toString()
    }

    const amount = (tr: AggregatedMovement) => {
        if (tr.type === MoveType.In) {
            return toSymbol(tr)
        } else if (tr.type === MoveType.Self) {
            return '0'
        }
        return '-' + toSymbol(tr)
    }

    const fee = (tr: AggregatedMovement) => {
        if (addr !== tr.movement.transaction.gasPayer) {
            return '0'
        }
        return '-' + fromWei(tr.movement.transaction.paid)
    }

    const remark = (tr: AggregatedMovement) => {
        let str = ''
        if (tr.type === MoveType.In) {
            str += 'received '
        } else if (tr.type === MoveType.Out) {
            str += 'sent '
        } else {
            str = 'self-transferred '
        }
        str += toSymbol(tr) + ' ' + AssetType[tr.movement.asset]
        return str
    }

    for (let tr of transfers) {
        if (AssetType[tr.movement.asset]) {
            const row = [
                tr.movement.txID,
                tr.seq.blockNumber,
                new Date(tr.movement.block.timestamp * 1000).toISOString().replace('T', ' ').replace(/\.\d*Z$/, ''),
                tr.movement.sender,
                tr.movement.recipient,
                amount(tr),
                AssetType[tr.movement.asset],
                fee(tr),
                remark(tr)
            ]
            tableBody.push(row)
        }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export-${addr}-${(new Date()).toISOString()}.csv"`);
    res.send(tableBody.map(x => x.join(',')).join('\r\n'))
}))