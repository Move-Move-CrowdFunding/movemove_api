import express from 'express'
import multer from 'multer'
import fs from 'fs'
import { ImgurClient } from 'imgur'
import authMiddleware from '../middleware/authMiddleware'

const router = express.Router()

// 上傳圖片API POST /upload
router.post('/', authMiddleware, async (req, res) => {
  /**
   * #swagger.consumes = ['multipart/form-data']
   * #swagger.tags = ['Upload - 圖片上傳']
   * #swagger.description = '單一圖片上傳 (儲存在Imgur相簿)'
   * #swagger.security = [{
      token: []
    }]
  * #swagger.parameters['body'] = {
      in: 'formData',
      description: 'form-data 帶圖片，必須為5MB以內的png或jpeg、gif類型圖檔',
      type: 'file',
      required: true
  }
  * #swagger.responses[200] = {
    description: '圖片上傳成功',
    schema: {
      "status": "success",
      "message":"圖片上傳成功",
      "results": {
        "imageUrl": "https://i.imgur.com/sample.jpeg"
      }
    }
  }
  *
  */

  try {
    // 暫存圖片
    let imgPath = 'temp/'
    const errorMsg = '必須為5MB以內的png或jpeg、gif類型圖檔'
    const upload = multer({
      dest: imgPath,
      limits: {
        // 允許的圖檔大小
        fileSize: 5 * 1024 * 1024
      },
      fileFilter: (req, file, cb) => {
        // 允許的圖檔類型
        const allowImgType = ['image/png', 'image/jpeg', 'image/gif']
        if (allowImgType.includes(file.mimetype.toString())) {
          cb(null, true)
        } else {
          cb(null, false)
          return cb(new Error(errorMsg))
        }
      }
    }).any()

    // 上傳圖片到 imgur
    upload(req, res, async () => {
      if (!req.files?.length) {
        // 接收圖片錯誤
        res.status(400).json({
          status: 'error',
          message: `發生錯誤: ${errorMsg}`
        })
      } else {
        // 加入 imgur client 資訊
        const client = new ImgurClient({
          clientId: process.env.IMGUR_CLIENTID,
          clientSecret: process.env.IMGUR_CLIENT_SECRET,
          refreshToken: process.env.IMGUR_REFRESH_TOKEN
        })
        // 圖片上傳至指定好的 imgur 相簿 (imgur ^2.0 API)
        imgPath = (req.files as any)[0].path
        const imgFile = fs.createReadStream(imgPath)
        const response = await client
          .upload({
            image: imgFile as any,
            type: 'stream',
            album: process.env.IMGUR_ALBUM_ID
          })
          .finally(() => {
            // 刪除暫存圖片
            fs.unlink(imgPath, (err) => {
              if (err) throw err
              // console.log(`${imgPath} was deleted`)
            })
          })
        // 回傳成功上傳的圖片網址
        if (response.success) {
          res.status(200).json({
            status: 'success',
            message: '圖片上傳成功',
            results: {
              imageUrl: response.data.link
              // 若有需要做刪除圖片的API時，可用 client.deleteImage('deletehash')
              // deletehash: response.data.deletehash
            }
          })
        } else {
          // 上傳到imgur錯誤
          res.status(400).json({
            status: 'error',
            message: `發生錯誤: ${response.data}`
          })
        }
      }
    })
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤'
    })
  }
})

export default router
