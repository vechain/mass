import * as Express from 'express'
import * as Logger from 'morgan'
import { hang, HttpError } from 'express-toolbox'
import { getConnectionOptions, createConnection } from 'typeorm'
import { getBest } from './db-service/block'
import { initLocalStore } from './local-store'

export const app = Express()

hang(app).until(async () => {
    await initLocalStore()
    
    const opt = await getConnectionOptions()
    await createConnection(Object.assign({}, opt, { synchronize: false, logging: false }))
    await getBest()
})

const errorHandler: Express.ErrorRequestHandler = function (err: Error, req, res, next) {
    if (err instanceof HttpError) {
        res.status(err.status).send(err.message)
    } else {
        process.stderr.write(err.stack + '\r\n')
        res.status(500).send('internal server error')
    }
}

const replacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return '0x'+value.toString(16)
    }
    return value
}

app.set('json replacer', replacer)
if (process.env['NODE_ENV'] === 'production') {
    app.enable('trust proxy')
}

// morgan('common") plus response time, for dev purpose 
app.use(Logger(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :response-time ms - :res[content-length]'))
    .use(Express.json())
    .use(Express.urlencoded({ extended: true }))
    .use('/api', require('./api'))
    .use(errorHandler)
