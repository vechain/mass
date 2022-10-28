import * as Express from 'express'

const api = Express()
export = api

api.use('/blocks', require('./blocks'))
api.use('/accounts', require('./accounts'))
api.use('/transactions', require('./transactions'))
api.use('/transfers', require('./transfers'))
api.use('/registry', require('./registry'))
api.use('/export', require('./export'))
api.use('/chain', require('./chain'))
