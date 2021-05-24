import { Router } from 'express'
import { try$ } from 'express-toolbox'
import {cache, keys} from '../db-service/cache'
import { Net } from '../net'

const router = Router()
export = router

const GhIO = new Net('https://vechain.github.io')
const CoinGecko = new Net('https://api.coingecko.com')

router.get('/tokens', try$(async (req, res) => {
    if (cache.has(keys.TOKENS)) {
        const tokens = cache.get(keys.TOKENS)
        return res.json(tokens)
    } else {
        const tokens = await GhIO.http('GET', `token-registry/${process.env['NETWORK']=='testnet'?'test':'main'}.json`)
        cache.set(keys.TOKENS, tokens, 30*60*1000)
        return res.json(tokens)
    }
}))

router.get('/price', try$(async (req, res) => {
    if (cache.has(keys.PRICE)) {
        const price = cache.get(keys.PRICE)
        return res.json(price)
    } else {
        const price = await CoinGecko.http('GET', 'api/v3/simple/price?ids=vechain,vethor-token&vs_currencies=btc')
        cache.set(keys.PRICE, price, 60 * 1000)
        return res.json(price)
    }
}))
