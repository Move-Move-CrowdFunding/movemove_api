import { Request } from 'express'
import jwt from 'jsonwebtoken'

interface tokenInfo extends Request {
  isLogin: boolean
  user: string | jwt.JwtPayload
  payload: string | jwt.JwtPayload
}

export default tokenInfo
