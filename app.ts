import express, { NextFunction, Request, Response } from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import connectDB from './connections/'
import type errorTask from './interface/errorTask'
import responseError from './service/responseError'
import cors from 'cors'
import session from 'express-session'

import homeRouter from './routes/index'
import userRouter from './routes/users'
import projectRouter from './routes/project'
import uploadRouter from './routes/upload'
import adminRouter from './routes/admin'
import memberRouter from './routes/member'
import paymentRouter from './routes/payment'
// import gmailAuthRouter from './routes/gmailAuth'

// Swagger 使用
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './swagger-output.json'

const app = express()
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// 出現預料外的錯誤
process.on('uncaughtException', (err) => {
  // 記錄錯誤下來，等到服務都處理完後，停掉該 process
  console.error('未捕抓到的異常', err)
  console.error(err.name)
  console.error(err.message)
  console.error(err.stack) // 可以追蹤到哪裡發生錯誤
  process.exit(1)
})

// 連接DB
connectDB()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors())
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
)

// app.use(loggingMiddleware)

app.use('/home', homeRouter)
app.use('/user', userRouter)
app.use('/project', projectRouter)
app.use('/upload', uploadRouter)
app.use('/admin', adminRouter)
app.use('/member', memberRouter)
app.use('/payment', paymentRouter)
// app.use('/gAuth', gmailAuthRouter)

// 404 路由
app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 'error',
    msg: '查無此路由'
  })
})

// next() 錯誤處理
app.use((err: errorTask, req: Request, res: Response, next: NextFunction) => {
  console.log('統一錯誤處理')
  console.log('當前環境為:', process.env.NODE_ENV)
  err.httpStatus = err.httpStatus || 500

  // 開發模式
  if (process.env.NODE_ENV === 'dev') {
    return responseError.error_dev(err, res)
  }

  // 生產模式
  // 可預期錯誤
  if (err.name === 'ValidationError') {
    err.isOperational = true

    const errors = Object.values(err.errors)
    const schemaError = errors.find((item: any) => item.name === 'ValidatorError')
    if (errors.length && schemaError) {
      // mongoose 驗證錯誤
      err.message = (schemaError as Error).message
    } else {
      err.message = '參數錯誤'
    }
    return responseError.error_production(err, res)
  }
  console.log(err.name)

  if (err.name === 'BSONError') {
    err.isOperational = true
    err.httpStatus = 400
    err.message = 'id 編碼錯誤'
    return responseError.error_production(err, res)
  }

  // 非預期錯誤
  responseError.error_production(err, res)
  next()
  console.log('req', req)
  console.log('res', res)
})

// 未捕捉到的 catch
process.on('unhandledRejection', (reason, promise) => {
  console.error('未捕捉到的 rejection：', promise, '原因：', reason)
  // 記錄於 log 上
})

export default app
