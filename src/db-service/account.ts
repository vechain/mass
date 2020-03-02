import { getConnection, In } from 'typeorm'
import { Account } from '../explorer-db/entity/account'
import { AssetType } from '../explorer-db/types'
import { Transaction } from '../explorer-db/entity/transaction'
import { TokenBalance } from '../explorer-db/entity/token-balance'
import { AggregatedMovement } from '../explorer-db/entity/aggregated-move'

export const getAccount = (addr: string) => {
    return getConnection()
        .getRepository(Account)
        .findOne({ address: addr })
}

export const getTokenBalance = (addr: string) => {
    return getConnection()
        .getRepository(TokenBalance)
        .find({where: {address: addr}, order: {type: 'ASC'}})
}

export const countAccountTransaction = async (addr: string) => {
    const acc = await getAccount(addr)
    if (!acc) {
        return 0
    } else {
        return acc.txCount
    }
}

export const getAccountTransaction = async (addr: string, offset: number, limit: number) => {
    const conn = getConnection()
    const ids = await conn
        .getRepository(Transaction)
        .find({
            select: ['txID'],
            where: { origin: addr },
            take: limit,
            skip: offset,
            order: { blockID: 'DESC', txIndex: 'DESC' }
        })
    const txs = await conn
        .getRepository(Transaction)
        .find({
            where: { txID: In(ids.map(x => x.txID)) },
            order: { blockID: 'DESC', txIndex: 'DESC' },
            relations:['block', 'receipt']
        })    
    return txs
}

export const countAccountTransfer = (addr: string) => {
    return getConnection()
        .getRepository(AggregatedMovement)
        .count({participant: addr})
}

export const getAccountTransfer = async (addr: string, offset: number, limit: number) => {
    const conn = getConnection()

    const ids = await conn
        .getRepository(AggregatedMovement)
        .find({
            select: ['id'],
            where: { participant: addr },
            order: { seq: 'DESC' },
            take: limit,
            skip: offset
        })
    
    const aggregated = await conn
        .getRepository(AggregatedMovement)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'DESC' },
            relations:[ 'movement', 'movement.block' ]
        })
    
    return aggregated
}

export const countAccountTransferByType = (addr: string, type: AssetType) => {
    return getConnection()
        .getRepository(AggregatedMovement)
        .count({participant: addr, type})
}

export const getAccountTransferByType = async (
    addr: string,
    type: AssetType,
    offset: number,
    limit: number
) => {
    const conn = getConnection()

    const ids = await conn
        .getRepository(AggregatedMovement)
        .find({
            select: ['id'],
            where: { participant: addr, type },
            order: { seq: 'DESC' },
            take: limit,
            skip: offset
        })
    
    const aggregated = await conn
        .getRepository(AggregatedMovement)
        .find({
            where: { id: In(ids.map(x => x.id)) },
            order: { seq: 'DESC' },
            relations:[ 'movement', 'movement.block' ]
        })
    
    return aggregated
}
