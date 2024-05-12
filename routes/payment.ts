import express, { Request, Response, NextFunction } from 'express'
import responseSuccess from '../service/responseSuccess'
import crypto from 'crypto'
import querystring from 'querystring'
import requiredRules from '../utils/requiredRules'

import authMiddleware from '../middleware/authMiddleware'
import catchAll from '../service/catchAll'

import tokenInfo from '../interface/tokenInfo'
import globalError from '../service/globalError'

import Sponsor from '../models/Sponsor'
import Project from '../models/Project'

const router = express.Router()

const order: any = {}
// 支持提案 - 建立訂單
router.post(
  '/support',
  authMiddleware,
  catchAll(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId, money, userName, phone, receiver, receiverPhone, address, isNeedFeedback } = req.body

    const requiredError: string[] = requiredRules({
      req,
      params: ['projectId', 'money', 'userName', 'phone', 'isNeedFeedback'],
      messageArea: 'payment'
    })
    if (requiredError.length) {
      return next(
        globalError({
          errMessage: requiredError[0]
        })
      )
    }

    if (isNeedFeedback) {
      const feedbackErr: string[] = requiredRules({
        req,
        params: ['receiver', 'receiverPhone', 'address'],
        messageArea: 'payment'
      })
      if (feedbackErr.length) {
        return next(
          globalError({
            errMessage: feedbackErr[0]
          })
        )
      }
    }
    const checkProject = await Project.findById(projectId)
    if (!checkProject) {
      return next(
        globalError({
          httpStatus: 404,
          errMessage: '查無該提案'
        })
      )
    }

    const sponsorData = {
      userId: (req as tokenInfo).user.id,
      projectId,
      money,
      userName,
      phone,
      receiver,
      receiverPhone,
      address,
      isNeedFeedback,
      MerchantOrderNo: String(Date.now())
    }
    const aesEncrypt = createAesEncrypt(sponsorData)
    const shaEncrypt = createShaEncrypt(aesEncrypt)

    order[sponsorData.MerchantOrderNo] = sponsorData
    responseSuccess.success({
      res,
      body: {
        message: '取得加密資料',
        aesEncrypt,
        shaEncrypt,
        sponsorData
      }
    })
  })
)

router.post(
  '/notify',
  catchAll(async (req: Request, res: Response) => {
    // 成功格式
    // const data = {
    //   Status: 'SUCCESS',
    //   MerchantID: 'MS152443410',
    //   Version: '2.0',
    //   TradeInfo:
    //     '8afa618a41c07f9cad54416364b3517e2c20914b589c2c386d81239ef0a9b5e8a7f4e9cf2ca7fa1849fa48b671bed2abac06df6c047f941fec832971efb4431754263002d9b8ce0edd44b8a4e22212be24e755b1f2e5bac7c5b252b0c6f853ab65ad6192fa0970ebbe37f8af53bfd3f32f178a4893bdf17833c77881a04dac9b57607eb3d6371116f8b737a0776df8b37e51275084c11a444272296193aa926b913432a63639d999ca2097a5ebfe8dde44d65e92824430d2a97daa892f09c3bf7589aa4c5fa4ac9c8ee2d0fd292a77eb0e707647b170b563276f824dc355733d7ddcc7acd003ac521cdc29d54ebcb4be165df650306f70af611a33d8c7fce2c6e22690dbcb4c69e4fd52d12ddbf4d6bc9e9bd86d48c54be61cbdd2901cbf83bb59102be65c1ee281a6a2503c22f112e4b98d69d984c9545bc5f531c8190421d6a7bdab325aa8ac381b01038221c0e26ee583ca434627aab72a94335f626789e3',
    //   TradeSha: '1187AA4C7833D91EC332FBD2C2F30623A5FF7EDE21EEF2EFC219E3040C680A36'
    // }
    const info = parseAes(req.body.TradeInfo)
    console.log('info', info)

    const orderDate = order[info.Result.MerchantOrderNo]

    await Sponsor.create({
      userId: orderDate.userId,
      projectId: orderDate.projectId,
      money: orderDate.money,
      userName: orderDate.userName,
      phone: orderDate.phone,
      receiver: orderDate.receiver,
      receiverPhone: orderDate.receiverPhone,
      address: orderDate.address,
      isNeedFeedback: orderDate.isNeedFeedback
    })

    responseSuccess.success({
      res,
      body: {
        message: info.Message
      }
    })
  })
)

// // 字串組合
function genDataChain(sponsorData: any) {
  const { MERCHANT_ID, VERSION, NOTIFY_URL } = process.env

  const data = {
    RespondType: 'JSON', // 回傳格式
    MerchantID: MERCHANT_ID, // 商店編碼
    TimeStamp: Math.ceil(Date.now() / 1000), // 時間戳記(秒)
    Version: VERSION, // 串接程式版本
    MerchantOrderNo: sponsorData.MerchantOrderNo, // 商店訂單編號
    Amt: sponsorData.money, // 訂單金額
    ItemDesc: '公益募捐', // 商品資訊(限長50),
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
