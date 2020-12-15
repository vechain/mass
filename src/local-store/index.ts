import * as os from 'os'
import * as path from 'path'
import { createConnection, LessThan } from 'typeorm'
import { Transaction } from './entities/transaction'

export const initLocalStore = async () => {
    const location = path.join(os.homedir(), '.mass', 'local.db')
    const conn = await createConnection({
        name: 'local',
        type: 'better-sqlite3',
        database: location,
        entities: [path.join(__dirname, 'entities/*')],
        synchronize: true
    })
    const repo = conn.getRepository(Transaction)
    const count = await repo.count()
    if (count > 100000) {
        // remove the txs that added 30 days before
        const timeline = new Date(Date.now()- 30 * 86400 * 1000)
        await repo.delete({createdAt: LessThan(timeline.toISOString())})
    }
}