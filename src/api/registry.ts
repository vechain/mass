import { Router } from 'express'
import { HttpError, try$ } from 'express-toolbox'
import { cache, keys } from '../db-service/cache'
import { Net } from '../net'

const router = Router()
export = router

const GhIO = new Net('https://vechain.github.io')
const CoinGecko = new Net('https://api.coingecko.com')

router.get('/tokens', try$(async (req, res) => {
    let lastUpdated: null|object = null
    if (cache.has(keys.TOKENS)) {
        const tokens = cache.get(keys.TOKENS)
        return res.json(tokens)
    } else {
        try {
            const tokens = await GhIO.http<object>('GET', `token-registry/${process.env['NETWORK'] == 'testnet' ? 'test' : 'main'}.json`)
            cache.set(keys.TOKENS, tokens, 30 * 60 * 1000)
            lastUpdated = tokens
            res.json(tokens)
        } catch (e) {
            if (!!lastUpdated) {
                res.json(lastUpdated)
            } else {
                throw new HttpError(500, 'failed to get registry')
            }
        }        
    }
}))

router.get('/price', try$(async (req, res) => {
    let lastUpdated: null | object = null
    if (cache.has(keys.PRICE)) {
        const price = cache.get(keys.PRICE)
        return res.json(price)
    } else {
        try {
            const price = await CoinGecko.http<object>('GET', 'api/v3/simple/price?ids=vechain,vethor-token&vs_currencies=btc')
            cache.set(keys.PRICE, price, 60 * 1000)
            lastUpdated = price
            res.json(price)
        } catch (e) {
            if (!!lastUpdated) {
                res.json(lastUpdated)
            } else {
                throw new HttpError(500, 'failed to get registry')
            }
        }        
    }
}))
