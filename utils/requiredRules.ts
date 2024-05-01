import requiredMessage from './requiredMessage'
import type { Request } from 'express'

const requiredRules = ({ req, params, messageArea }: { req: Request; params: string[]; messageArea: string }) => {
  return params
    .map((item) => {
      return !req.body[item] ? requiredMessage[messageArea][item] : ''
    })
    .filter(Boolean)
}

export default requiredRules
