import express from 'express'
import bcrypt from 'bcrypt'
import UserModal from '../models/User'

import { getJWTtoken } from '../utils/jwt'

const router = express.Router()

router.post('/sign-up', async function (req, res) {
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
    }

    // const SecretKey = process.env.JWT_SECRET_KEY || ''
    // const token = jwt.sign({ email }, SecretKey, { expiresIn: '1d' })
    // console.log(token)

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

router.post('/login', async function (req, res) {
  try {
    // console.log(req)
    console.log(req.body)
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
      const hashedPassword = await bcrypt.hash(password, 10)
      if (hashedPassword === userData.password) {
        const token = getJWTtoken(email)
        res.status(200).json({
          status: 'success',
          message: '登入成功',
          results: {
            token
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

export default router
