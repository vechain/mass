import { getConnection } from 'typeorm'
import { Account } from '../explorer-db/entity/account'
import { TokenBalance } from '../explorer-db/entity/token-balance'

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
