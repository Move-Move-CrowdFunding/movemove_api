import jwt from 'jsonwebtoken'

export const getJWTtoken = (email: string, auth: number) => {
  const SecretKey = process.env.JWT_SECRET_KEY || ''
  const token = jwt.sign({ email, auth }, SecretKey, { expiresIn: '1d' })
  return token
}

export const verifyJWTtoken = (token: string) => {
  const SecretKey = process.env.JWT_SECRET_KEY || ''
  return jwt.verify(token, SecretKey)
}
