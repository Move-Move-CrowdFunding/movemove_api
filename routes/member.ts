import express, { Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import bcrypt from 'bcrypt'

import type { paginationReq } from '../interface/pagination'
import catchAll from '../service/catchAll'
import globalError from '../service/globalError'
import responseSuccess from '../service/responseSuccess'

import authMiddleware from '../middleware/authMiddleware'

import Project from '../models/Project'
import UserModal from '../models/User'

const router = express.Router()

// 獲取單一提案
router.get(
  '/project/:id',
  authMiddleware,
  catchAll(async (req: paginationReq, res: Response, next: NextFunction) => {
    /**
     * #swagger.tags = ['Member - 會員中心']
     * #swagger.description = '我的單一提案內容'
     * #swagger.security = [{
        token: []
       }]
     * #swagger.parameters['id'] = {
        in: 'path',
        description: '提案 id'
       }
     * #swagger.responses[200] = {
        description: '取得我的單一提案內容',
        schema: {
          "status": "success",
          "message": "取得提案內容成功",
          "results": {
            "id": "663e3f9652027aeb86960016",
            "userId": "663e3f3452027aeb8696000c",
            "categoryKey": 2,
            "coverUrl": "https://fakeimg.pl/300/",
            "describe": "一場無情的大火吞噬了整個社區，請幫助無家可歸的民眾。",
            "endDate": 1721577600,
            "title": "2",
            "videoUrl": "",
            "startDate": 1720713600,
            "feedbackItem": "限量精美小熊維尼",
            "feedbackUrl": "https://fakeimg.pl/300/",
            "feedbackMoney": 100,
            "feedbackDate": 1721577600,
            "targetMoney": 30000,
            "teamName": "弱勢救星",
            "phone": "0938938438",
            "email": "nomail@mail.com",
            "relatedUrl": "",
            "introduce": "專業金援團隊，弱勢族群救星，幫助許多需要協助的家庭。",
            "content": "<p>test</p>",
            "achievedMoney": 2200,
            "supportCount": 2,
            "trackingStatus": true,
            "state": []
          }
        }
      }
      * #swagger.responses[404] = {
        description: '查無此提案',
        schema: {
          "status": "error",
          "message": "查無此提案"
        },
      }
     */

    const data = await Project.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(req.params.id)
        }
      },
      // {
      //   $lookup: {
      //     from: 'sponsors',
      //     localField: '_id',
      //     foreignField: 'projectId',
      //     as: 'sponsorList'
      //   }
      // },
      // {
      //   $lookup: {
      //     from: 'tracks',
      //     localField: '_id',
      //     foreignField: 'projectId',
      //     as: 'trackList'
      //   }
      // },
      {
        $lookup: {
          from: 'checks',
          localField: '_id',
          foreignField: 'projectId',
          as: 'checkList'
        }
      }
    ])

    if (data.length) {
      const {
        _id,
        userId,
        categoryKey,
        coverUrl,
        describe,
        endDate,
        title,
        videoUrl,
        startDate,
        feedbackItem,
        feedbackUrl,
        feedbackMoney,
        feedbackDate,
        targetMoney,
        teamName,
        phone,
        email,
        relatedUrl,
        introduce,
        content,
        // sponsorList,
        // trackList,
        checkList
      } = data[0]

      if (!userId.equals(new Types.ObjectId(req.user.id))) {
        // 不是該用戶提案
        return next(
          globalError({
            httpStatus: 403,
            errMessage: '身分驗證錯誤'
          })
        )
      }

      const results: any = {
        id: _id,
        categoryKey,
        coverUrl,
        describe,
        endDate,
        title,
        videoUrl,
        startDate,
        feedbackItem,
        feedbackUrl,
        feedbackMoney,
        feedbackDate,
        targetMoney,
        teamName,
        phone,
        email,
        relatedUrl,
        introduce,
        content,
        // achievedMoney: sponsorList.reduce((num: number, sponsor: any) => num + Number(sponsor.money), 0),
        // supportCount: sponsorList.length,
        // trackingStatus:
        //   req.isLogin && !!trackList.find((track: any) => track.userId.equals(new Types.ObjectId(req.payload.id))),
        state: checkList.map((check: any) => ({
          content: check.content,
          status: check.status,
          createTime: check.createTime
        }))
      }

      responseSuccess.success({
        res,
        body: {
          message: '取得提案內容成功',
          results
        }
      })
      return
    }
    next(
      globalError({
        httpStatus: 404,
        errMessage: '查無此提案'
      })
    )
  })
)

// 用戶端 修改密碼 PATCH /member/password
router.patch('/password', authMiddleware, async (req, res) => {
  /**
   * #swagger.tags = ['Member - 會員中心']
   * #swagger.description = '密碼修改'
   * #swagger.security = [{
      token: []
    }]
  * #swagger.parameters['body'] = {
    in: 'body',
    description: '修改密碼，至少8碼',
    type: 'object',
    required: true,
    schema: {
      "oldPassword": "11111111",
      "newPassword": "22222222"
    }
  }
  * #swagger.responses[200] = {
    description: '密碼修改成功',
    schema: {
      "status": "success",
      "message": "密碼修改成功"
    }
  }
  *
  */

  try {
    const { id } = (req as any).user
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: '新、舊密碼為必填'
      })
    }

    if (oldPassword.length < 8 || newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: '密碼至少要8碼'
      })
    }

    const userData = await UserModal.findOne({ _id: id })
    if (userData) {
      const isPasswordValid = await bcrypt.compare(`${oldPassword}`, userData.password)
      if (isPasswordValid) {
        const newPasswordHashed = await bcrypt.hash(newPassword, 10)
        await UserModal.findByIdAndUpdate(id, { password: newPasswordHashed }).then(() => {
          return res.status(200).json({
            status: 'success',
            message: '密碼修改成功'
          })
        })
      } else {
        return res.status(400).json({
          status: 'error',
          message: '舊密碼錯誤'
        })
      }
    } else {
      return res.status(400).json({
        status: 'error',
        message: '不存在的用戶'
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤' + error
    })
  }
})

export default router
