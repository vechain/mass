import { Router } from 'express'
import { try$ } from 'express-toolbox'
import { getStatus } from '../db-service/chain'

const router = Router()
export = router

router.get('/status', try$(async (req, res) => {
    const status = await getStatus()
    res.json(status)
}))
