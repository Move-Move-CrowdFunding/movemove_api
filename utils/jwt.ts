import jwt from 'jsonwebtoken'

export const getJWTtoken = (auth: number, id: string) => {
  const SecretKey = process.env.JWT_SECRET_KEY || ''
  const token = jwt.sign({ auth, id }, SecretKey, { expiresIn: '1d' })
  return token
}

export const verifyJWTtoken = (token: string) => {
  const SecretKey = process.env.JWT_SECRET_KEY || ''
  return jwt.verify(token, SecretKey)
}
