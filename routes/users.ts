import express from 'express'
import bcrypt from 'bcrypt'
import UserModal from '../models/User'

import { getJWTtoken, verifyJWTtoken } from '../utils/jwt'

const router = express.Router()

// 註冊
router.post('/sign-up', async function (req, res) {
  /**
     * #swagger.tags = ['User']
     * #swagger.description = '會員註冊'
     * #swagger.security = [{
        token: []
       }]
     * #swagger.parameters['body'] = {
        in: 'body',
        description: '會員註冊',
        type: 'object',
        required: true,
        schema: {
          $email: 'elsa@gmail.com',
          $password: 'abc123456',
          niclName: 'elsa'
        }
       }
     * #swagger.responses[200] = {
        description: '登入成功',
        schema: {
          "status": "success",
          "message": "註冊成功",
        },
       }
     * #swagger.responses[400] = {
        description: '註冊失敗',
        schema: {
          "status": "error",
          "message": "請輸入Email | 請輸入有效的Email | 請輸入Password | 密碼至少需要 8 位數 | 這個 Email 已經被註冊過了"
        },
       }
     *
     */
  try {
    // console.log(req)
    console.log(req.body)
    const { email, password, nickName } = req.body

    if (!email) {
      res.status(400).json({
        status: 'error',
        message: '請輸入Email'
      })
      return
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        res.status(400).json({
          status: 'error',
          message: '請輸入有效的Email'
        })
        return
      }
    }

    if (!password) {
      res.status(400).json({
        status: 'error',
        message: '請輸入Password'
      })
      return
    } else {
      // 密碼長度需大於 8
      if (password.length < 8) {
        res.status(400).json({
          status: 'error',
          message: '密碼至少需要 8 位數'
        })
        return
      }
    }

    const userData = await UserModal.findOne({ email })
    if (userData) {
      res.status(400).json({
        status: 'error',
        message: '這個 Email 已經被註冊過了'
      })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const data = {
      email,
      nickName,
      password: hashedPassword
    }

    const result = await UserModal.create(data)
    const { _id, nickName: resNickName, email: resEmail } = result
    res.status(200).json({
      status: 'success',
      message: '註冊成功',
      results: {
        id: _id,
        email: resEmail,
        nickName: resNickName
      }
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '伺服器錯誤'
    })
  }
})

// 登入
router.post('/login', async function (req, res) {
  /**
     * #swagger.tags = ['User']
     * #swagger.description = '會員登入'
     * #swagger.security = [{
        token: []
       }]
     * #swagger.parameters['body'] = {
        in: 'body',
        description: '會員登入',
        type: 'object',
        required: true,
        schema: {
          $email: 'elsa@gmail.com',
          $password: 'abc123456',
        }
       }
     * #swagger.responses[200] = {
        description: '登入成功',
        schema: {
          "status": "success",
          "message": "登入成功",
          "results": {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVsc2FAZ21haWwuY29tIiwiYXV0aCI6MCwiaWF0IjoxNzE1MTAwODQxLCJleHAiOjE3MTUxODcyNDF9.iENpkK1osDQguIKY2oAmDkzuSo049qtWQlG0SwzSnTY",
            expires: 1615108416,
            avatar: "https://fakeimg.pl/300/",
            auth: 0
          }
        },
       }
     * #swagger.responses[400] = {
        description: '登入失敗',
        schema: {
          "status": "error",
          "message": "請輸入Email | 請輸入有效的Email | 請輸入Password | 密碼錯誤 | 這個 Email 尚未註冊"
        },
       }
     *
     */
  try {
    const { email, password } = req.body

    if (!email) {
      res.status(400).json({
        status: 'error',
        message: '請輸入Email'
      })
      return
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        res.status(400).json({
          status: 'error',
          message: '請輸入有效的Email'
        })
        return
      }
    }

    if (!password) {
      res.status(400).json({
        status: 'error',
        message: '請輸入Password'
      })
      return
    }

    const userData = await UserModal.findOne({ email })
    if (userData) {
      const isPasswordValid = await bcrypt.compare(`${password}`, userData.password)

      if (isPasswordValid) {
        const token = getJWTtoken(email, userData.auth || 0)
        res.status(200).json({
          status: 'success',
          message: '登入成功',
          results: {
            token,
            expires: Math.floor(Date.now() / 1000),
            avatar: userData.avatar,
            auth: userData.auth
          }
        })
      } else {
        res.status(400).json({
          status: 'error',
          message: '密碼錯誤'
        })
      }
    } else {
      res.status(400).json({
        status: 'error',
        message: '這個 Email 尚未註冊'
      })
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '伺服器錯誤'
    })
  }
})

// 確認登入
router.post('/check-login', async function (req, res) {
  /**
     * #swagger.tags = ['User']
     * #swagger.description = '確認登入'
     * #swagger.security = [{
        token: []
       }]
    * #swagger.parameters['header'] = {
        in: 'header',
        name: 'authorization',
        description: 'Bearer token',
        required: true,
        type: 'string'
      }
     * #swagger.responses[200] = {
        description: '登入成功',
        schema: {
          "status": "success",
          "message": "登入成功"
        },
       }
     * #swagger.responses[401] = {
        description: '登入失敗',
        schema: {
          "status": "error",
          "message": "身分驗證失敗，請重新登入"
        },
       }
     *
     */
  try {
    const { authorization } = req.headers

    if (!authorization) {
      res.status(401).json({
        status: 'error',
        message: '身分驗證失敗，請重新登入'
      })
    } else {
      const token = authorization.replace('Bearer ', '')
      try {
        await verifyJWTtoken(token)
        res.status(200).json({
          status: 'success',
          message: '登入成功'
        })
      } catch (error) {
        res.status(401).json({
          status: 'error',
          message: '身分驗證失敗，請重新登入'
        })
      }
    }
  } catch (error) {
    console.log(error)

    res.status(500).json({
      status: 'error',
      message: '伺服器錯誤'
    })
  }
})

export default router
