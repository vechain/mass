import { Net } from './net'

if (!process.env.THOR_REST) {
    throw new Error('THOR_REST env required')
}
const genesisID = process.env['NETWORK']=='testnet'?'0x000000000b2bce3c70bc649a02749e8687721b09ed2e15997f466536b20bb127':'0x00000000851caf3cfdb6e899cf5958bfb1ac3413d346d43539627e6be7ec1b4a'
const net = new Net(process.env.THOR_REST)

const headerValidator = (headers: Record<string, string>) => {
    const xGeneID = headers['x-genesis-id']
    if (xGeneID && xGeneID !== genesisID) {
        throw new Error(`responded 'x-genesis-id' not match`)
    }
}

export const getPendingTx = (txid: string) => {
    return net.http('GET', `transactions/${txid}`, { query: { pending: 'true'}, validateResponseHeader: headerValidator } )
}
