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

export const generateEmailToken = () => {
  const code = generateRandomCode()

  const token = jwt.sign({ code }, process.env.JWT_SECRET_KEY || '', {
    expiresIn: 3600
  })

  return { code, token }
}

const generateRandomCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  let code = ''

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    code += characters.charAt(randomIndex)
  }

  return code
}
