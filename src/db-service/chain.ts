import { getForkConfig, Network } from '../config'
import * as thor from '../thor';
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

export const getFinalized = async (bestNum: number) => {
    if (bestNum < forkConfig.VIP220) {
        return network
    }

    const checkpoint = toCheckpoint(bestNum)
    const cached = checkpointToFinalized.get(checkpoint)
    if (!cached || (bestNum + 1) % checkpointInterval === 0) {
        const finalized = await thor.getFinalizedBlock()

        // explorer is syncing, return genesis
        if (finalized.number >= bestNum) {
            return network
        }

        if ((bestNum + 1) % checkpointInterval === 0) {
            checkpointToFinalized.set(checkpoint + checkpointInterval, finalized.id)
        } else {
            checkpointToFinalized.set(checkpoint, finalized.id)
        }
        return finalized.id
    } else {
        return cached
    }
}

export const getStatus = async (best:string) => {
    if (status.best != best) {
        status.best = best
        const bestNum = blockIDtoNum(status.best)
        if (bestNum >= status.voting + checkpointInterval) {
            if (bestNum < forkConfig.VIP220) {
                status.voting = toCheckpoint(forkConfig.VIP220)
            } else {
                status.voting = toCheckpoint(bestNum)
            }
        }
        status.finalized = await getFinalized(bestNum)
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

