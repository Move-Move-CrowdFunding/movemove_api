import type { Response } from 'express'

const responseSuccess = {
  success({ res, httpStatus, body }: { res: Response; httpStatus?: number | string; body: any }) {
    res.status(Number(httpStatus) || 200).json({
      status: 'success',
      ...body
    })
  }
}

export default responseSuccess
