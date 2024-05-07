import jwt from 'jsonwebtoken'

export const getJWTtoken = (email: string) => {
  const SecretKey = process.env.JWT_SECRET_KEY || ''
  const token = jwt.sign({ email }, SecretKey, { expiresIn: '1d' })
  return token
}

export const verifyJWTtoken = (token: string) => {
  const SecretKey = process.env.JWT_SECRET_KEY || ''
  return jwt.verify(token, SecretKey)
}
