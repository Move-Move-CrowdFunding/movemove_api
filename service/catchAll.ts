import type { NextFunction, Request, Response } from 'express'

/**
 * @param callback async function
 */
const catchAll = (callback: { (req: any, res: any, next: any): Promise<void> }) => {
  return function (req: Request, res: Response, next: NextFunction) {
    callback(req, res, next).catch((err: any) => {
      return next(err)
    })
  }
}

export default catchAll
