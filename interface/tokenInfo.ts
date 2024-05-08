import { Request } from 'express'
import jwt from 'jsonwebtoken'

interface tokenInfo extends Request {
  isLogin: boolean
  user: {
    auth: number
    id: string
    [key: string]: any
  }
  payload: string | jwt.JwtPayload
}

export default tokenInfo
