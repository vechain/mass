import * as os from 'os'
import * as path from 'path'
import { createConnection} from 'typeorm'

export const initLocalStore = async () => {
    const location = path.join(os.homedir(), '.mass', 'local.db')
    await createConnection({
        name: 'local',
        type: 'better-sqlite3',
        database: location,
        entities: [path.join(__dirname, 'entities/*')],
        synchronize: true,
        logging: true,
        logger:"advanced-console"
    })
}