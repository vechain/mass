import { Router } from 'express'
import { try$ } from 'express-toolbox'
import { cache, keys } from '../db-service/cache'
import { Net } from '../net'
import { normalizeAsset } from '../token'

const router = Router()
export = router

const GhIO = new Net('https://vechain.github.io')
const CoinGecko = new Net('https://api.coingecko.com')

interface Token {
    symbol: string
}

const filterSupportedToken = (tokens: Array<Token>) => { 
    return tokens.filter(x => normalizeAsset(x.symbol) !== 'N/A')
}

router.get('/tokens', try$(async (req, res) => {
    let lastUpdated: null|Array<Token> = null
    if (cache.has(keys.TOKENS)) {
        const tokens = cache.get(keys.TOKENS)
        return res.json(tokens)
    } else {
        try {
            const tokens = await GhIO.http<Array<Token>>('GET', `token-registry/${process.env['NETWORK'] == 'testnet' ? 'test' : 'main'}.json`)
            cache.set(keys.TOKENS, tokens, 30 * 60 * 1000)
            lastUpdated = tokens
            res.json(filterSupportedToken(tokens))
        } catch (e) {
            if (!!lastUpdated) {
                res.json(filterSupportedToken(lastUpdated))
            } else {
                console.warn('registry: get token failed')
                res.json([])
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
                console.warn('registry: get price failed')
                res.json({
                    'vechain': {
                        btc: 0
                    },
                    'vethor-token': {
                        btc:0
                    }
                })
            }
        }        
    }
}))
