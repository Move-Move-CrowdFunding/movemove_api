import express, { Request, Response, NextFunction } from 'express'
import responseSuccess from '../service/responseSuccess'
import crypto from 'crypto'

import authMiddleware from '../middleware/authMiddleware'
import catchAll from '../service/catchAll'

import tokenInfo from '../interface/tokenInfo'

import Sponsor from '../models/Sponsor'

const router = express.Router()

// 支持提案 - 建立訂單
router.post(
  '/support',
  authMiddleware,
  catchAll(async (req: Request, res: Response) => {
    // const sponsorData = await Sponsor.create({
    //   userId: (req as tokenInfo).user.id,
    //   ...req.body
    // })
    const { projectId, money, username, phone, receiver, receiverPhone, address, isNeedFeedback } = req.body
    const sponsorData = {
      projectId,
      money,
      username,
      phone,
      receiver,
      receiverPhone,
      address,
      isNeedFeedback
    }
    const aesEncrypt = createAesEncrypt(sponsorData)
    const shaEncrypt = createShaEncrypt(aesEncrypt)

    responseSuccess.success({
      res,
      body: {
        message: '取得加密資料',
        aesEncrypt,
        shaEncrypt
      }
    })
  })
)

router.post(
  '/notify',
  authMiddleware,
  catchAll(async (req: Request, res: Response) => {
    const info = parseAes(req.body.TradeInfo)
    console.log('info', info)

    // const projectId = info.Result.MerchantOrderNo
    // const sponsorData = await Sponsor.create({
    //   userId: (req as tokenInfo).user.id,
    //   ...req.body
    // })

    res.end()
  })
)

// // 字串組合
function genDataChain(sponsorData: any) {
  const { MERCHANT_ID, VERSION, NOTIFY_URL } = process.env

  const data = {
    RespondType: 'JSON', // 回傳格式
    MerchantID: MERCHANT_ID, // 商店編碼
    TimeStamp: sponsorData.createTime, // 時間戳記(秒)
    Version: VERSION, // 串接程式版本
    MerchantOrderNo: sponsorData.projectId, // 商店訂單編號
    Amt: sponsorData.money, // 訂單金額
    ItemDesc: '支持提案', // 商品資訊(限長50),
    NotifyURL: NOTIFY_URL
  }

  const str = Object.keys(data)
    .map((key: string) => `${key}=${(data as any)[key]}`)
    .join('&')
  return str
}
// 使用 aes 加密 => 交易資料加密
function createAesEncrypt(sponsorData: any) {
  const { HASH_KEY, HASH_IV } = process.env

  const encrypt = (crypto as any).createCipheriv('aes256', HASH_KEY, HASH_IV)
  const enc = encrypt.update(genDataChain(sponsorData), 'utf8', 'hex')
  return enc + encrypt.final('hex')
}
// 對應文件 P17：使用 sha256 加密 => 驗證使用
// $hashs="HashKey=".$key."&".$edata1."&HashIV=".$iv;
function createShaEncrypt(aesEncrypt: string) {
  const { HASH_KEY, HASH_IV } = process.env

  const sha = crypto.createHash('sha256')
  const plainText = `HashKey=${HASH_KEY}&${aesEncrypt}&HashIV=${HASH_IV}`

  return sha.update(plainText).digest('hex').toUpperCase()
}

// aes 解密
function parseAes(TradeInfo: any) {
  const { HASH_KEY, HASH_IV } = process.env

  const decrypt = (crypto as any).createDecipheriv('aes256', HASH_KEY, HASH_IV)
  decrypt.setAutoPadding(false)
  const text = decrypt.update(TradeInfo, 'hex', 'utf8')
  const plainText = text + decrypt.final('utf8')
  const result = plainText.replace(/[\x00-\x20]+/g, '')
  return JSON.parse(result)
}
export default router
