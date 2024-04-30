import type errorTask from '../interface/errorTask'
import type { Response } from 'express'

const responseError = {
  error_dev(err: errorTask, res: Response) {
    res.status(err.httpStatus || 400).json({
      status: 'error',
      message: err.message,
      error: err,
      errorName: err.name,
      errorStack: err.stack
    })
  },
  error_production(err: errorTask, res: Response) {
    if (err.isOperational) {
      res.status(err.httpStatus || 400).json({
        status: 'error',
        message: err.message
      })
    } else {
      console.log('出現預期外的錯誤!', err)
      res.status(500).json({
        status: 'error',
        message: '服務器錯誤'
      })
    }
  }
}

export default responseError
