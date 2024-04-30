import express from 'express'
import catchAll from '../service/catchAll'
const router = express.Router()

/* GET home page. */
router.get(
  '/home',
  catchAll(async (req, res, next) => {
    console.log('首頁')
  })
)

export default router
