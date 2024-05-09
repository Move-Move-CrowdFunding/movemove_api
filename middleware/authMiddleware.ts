import { Request, Response, NextFunction } from 'express'
import jwt, { GetPublicKeyOrSecret, Secret } from 'jsonwebtoken'

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authorizationHeader = req.header('Authorization') || req.header('authorization')

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: 'error', message: ' Authorization header 缺失 Bearer' })
  }

  const token = authorizationHeader.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ success: 'error', message: 'Authorization token 不合法' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as GetPublicKeyOrSecret | Secret)
    ;(req as any).user = decoded
    next()
  } catch (err) {
    console.error(err)
    return res.status(401).json({ success: 'error', message: 'token 已失效，請重新登入' })
  }
}
export default authMiddleware
