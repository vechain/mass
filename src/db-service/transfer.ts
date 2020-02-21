import { getConnection } from 'typeorm'
import { AssetMovement } from '../explorer-db/entity/movement'
import { keys, cache } from './cache'
import { Transaction } from '../explorer-db/entity/transaction'
import { blockIDtoNum, REVERSIBLE_WINDOW } from '../utils'

export const getRecentTransfers = (limit: number) => {
    return getConnection()
        .getRepository(AssetMovement)
        .createQueryBuilder('asset')
        .orderBy({ blockID: 'DESC', moveIndex: 'DESC' })
        .limit(limit)
        .leftJoinAndSelect('asset.block', 'block')
        .getMany()
}

export const getTransferByTX = async (tx: Transaction) => {
    const { txID } =  tx
    const key = keys.TX_TRANSFER(txID)
    if (cache.has(key)) {
        return cache.get(key) as AssetMovement[]
    }

    const transfers = await getConnection()
        .getRepository(AssetMovement)
        .find({
            where: { txID },
            order: {moveIndex: 'ASC'}
        })
    
    const best = cache.get(keys.LAST_BEST) as number
    if (best) {
        if (best - blockIDtoNum(tx.blockID) >= REVERSIBLE_WINDOW) {
            cache.set(key, transfers)
        }
    }
    return transfers
}
