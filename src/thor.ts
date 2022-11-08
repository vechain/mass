import { Network } from './config'
import { Net } from './net'

if (!process.env.THOR_REST) {
    throw new Error('THOR_REST env required')
}
const genesisID = process.env['NETWORK'] == 'testnet' ? Network.TestNet : Network.MainNet
const net = new Net(process.env.THOR_REST)

const headerValidator = (headers: Record<string, string>) => {
    const xGeneID = headers['x-genesis-id']
    if (xGeneID && xGeneID !== genesisID) {
        throw new Error(`responded 'x-genesis-id' not match`)
    }
}

export const getPendingTx = (txid: string) => {
    return net.http<PendingTransaction | null>('GET', `transactions/${txid}`, { query: { pending: 'true' }, validateResponseHeader: headerValidator })
}

export const getFinalizedBlock = () => {
    return net.http<Block>('GET', 'blocks/finalized', { validateResponseHeader: headerValidator })
}

export type PendingTransaction = {
    id: string
    chainTag: number
    blockRef: string
    expiration: number
    clauses: Array<{
        to: string | null
        value: string
        data: string
    }>
    gasPriceCoef: number
    gas: number
    origin: string
    delegator: string | null
    nonce: string
    dependsOn: string | null
    size: number
    meta: null
}

export type Block = {
    id: string;
    number: number;
}
