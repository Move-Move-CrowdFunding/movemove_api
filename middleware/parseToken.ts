import { Request, Response, NextFunction } from 'express'
import type tokenInfo from '../interface/tokenInfo'
import jwt from 'jsonwebtoken'

const parseToken = (req: Request, res: Response, next: NextFunction) => {
  const authorizationHeader = req.header('Authorization')
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    ;(req as tokenInfo).isLogin = false
    return next()
  }
  const token = authorizationHeader.replace('Bearer ', '')

  if (!token) {
    ;(req as tokenInfo).isLogin = false
    return next()
  }

  try {
    const decoded = jwt.verify(token, (process.env as any).JWT_SECRET_KEY)
    ;(req as tokenInfo).isLogin = true
    ;(req as tokenInfo).payload = decoded

    next()
  } catch (err) {
    ;(req as tokenInfo).isLogin = false
    return next()
  }
}

export default parseToken
