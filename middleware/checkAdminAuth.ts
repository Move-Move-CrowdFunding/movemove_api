import { Request, Response, NextFunction } from 'express'
import { verifyJWTtoken } from '../utils/jwt'

// 登入身份檢查
const checkAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { authorization, Authorization } = req.headers
    const auth = authorization || Authorization || ''
    const token = String(auth).replace('Bearer ', '')
    const tokenPayload: any = verifyJWTtoken(token)
    return tokenPayload.auth !== 1
      ? res.status(401).json({ success: 'error', message: '身分驗證失敗，僅限管理員' })
      : next()
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤'
    })
  }
}

export default checkAdminAuth
