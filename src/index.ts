#!/usr/bin/env node

/**
 * Module dependencies.
 */

import { app } from './app'
import * as http from 'http'

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000')
app.set('port', port)

/**
 * Create HTTP server.
 */

const server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
    .on('error', (err: any) => {
        if (err.syscall !== 'listen') {
            throw err
        }

        const bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port

        // handle specific listen errors with friendly messages
        switch (err.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges')
                process.exit(1)
                break
            case 'EADDRINUSE':
                console.error(bind + ' is already in use')
                process.exit(1)
                break
            default:
                throw err
        }
    })
    .on('listening', () => {
        const addr = server.address()!
        const bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port
        console.log('Listening on ' + bind)
    })

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: any) {
    const port = parseInt(val, 10)

    if (isNaN(port)) {
        // named pipe
        return val
    }

    if (port >= 0) {
        // port number
        return port
    }

    return false
}
