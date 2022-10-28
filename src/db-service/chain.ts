import { getForkConfig, Network } from '../config'
import { getFinalizedBlock } from '../thor';
import { blockIDtoNum } from '../utils'
import { getBest } from './block'

const checkpointInterval = 180

export interface ChainStatus {
    best: string;
    finalized: string;
    processing: number[];
    voting: number;
}

let status: ChainStatus = {
    best: '',
    finalized: '',
    processing: [],
    voting: 0,
}

const checkpointToFinalized = new Map<number, string>()
const network = process.env['NETWORK'] == 'testnet' ? Network.TestNet : Network.MainNet
const forkConfig = getForkConfig(network)

const toCheckpoint = (input: number) => {
    return Math.floor(input / checkpointInterval) * checkpointInterval
}

export const getStatus = async () => {
    const best = await getBest()

    if (status.best != best.id) {
        status.best = best.id
        const bestNum = blockIDtoNum(status.best)
        if (bestNum >= status.voting + checkpointInterval) {
            if (bestNum < forkConfig.VIP220) {
                status.voting = toCheckpoint(forkConfig.VIP220)
            } else {
                status.voting = toCheckpoint(bestNum)
            }
        }

        const cached = checkpointToFinalized.get(status.voting)
        if (!cached || (bestNum + 1) % checkpointInterval === 0) {
            const finalized = await getFinalizedBlock()
            status.finalized = finalized.id
            if ((bestNum + 1) % checkpointInterval === 0) {
                checkpointToFinalized.set(status.voting + checkpointInterval, status.finalized)
            } else {
                checkpointToFinalized.set(status.voting, status.finalized)
            }
        } else {
            status.finalized = cached
        }

        status.processing = []
        if (status.voting > forkConfig.VIP220) {
            let start = blockIDtoNum(status.finalized)
            const forkStart = toCheckpoint(forkConfig.VIP220)
            if (start < forkStart) {
                start = forkStart
                status.processing.push(forkStart)
            }

            for (let i = start + checkpointInterval; i < status.voting; i += checkpointInterval) {
                status.processing.push(i)
            }
        }
    }
    return status
}

