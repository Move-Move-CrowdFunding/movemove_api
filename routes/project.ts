import express, { Request, Response, NextFunction } from 'express'

import catchAll from '../service/catchAll'
import requiredRules from '../utils/requiredRules'
import globalError from '../service/globalError'
import responseSuccess from '../service/responseSuccess'

import Project from '../models/Project'
import User from '../models/User'

import moment from 'moment'
const router = express.Router()

// 發起提案 => TODO: 查詢是否存在該用戶 && middleware
router.post(
  '/',
  catchAll(async (req: Request, res: Response, next: NextFunction) => {
    /**
     * #swagger.tags = ['Projects - 提案']
     * #swagger.description = '發起提案'
     * #swagger.security = [{
        token: []
       }]
     * #swagger.parameters['body'] = {
        in: 'body',
        description: '發起提案格式',
        type: 'object',
        required: true,
        schema: {
          $userId: '66378c5f9fb5b5e7c300e95c',
          introduce: '團隊介紹',
          $teamName: '提案人姓名/團隊名稱',
          $title: '提案標題',
          $email: '聯絡信箱',
          $categoryKey: 1,
          $phone: '連絡電話',
          $targetMoney: 50000,
          $content: '<p>提案內容</p>',
          $coverUrl: 'https://fakeimg.pl/300/',
          $describe: '提案簡介',
          videoUrl: 'https://youtube.com/',
          $startDate: 1678982400,
          $endDate: 1679846400,
          relatedUrl: 'https://www.google.com/',
          feedbackItem: '限量精美小熊維尼',
          feedbackUrl: 'https://fakeimg.pl/300/',
          feedbackMoney: 100,
          feedbackDate: 1682524800
        }
       }
     * #swagger.responses[200] = {
        description: '發起提案成功',
        schema: {
          "status": "success",
          "message": "資料新增成功"
        },
       }
     * #swagger.responses[400] = {
        description: '發起提案失敗',
        schema: {
          "status": "error",
          "message": "請輸入提案標題"
        },
       }
     *
     */
    const {
      userId = '',
      introduce = '',
      teamName = '',
      title = '',
      email = '',
      categoryKey = 0,
      phone = '',
      targetMoney = 0,
      content = '',
      coverUrl = '',
      describe = '',
      videoUrl = '',
      startDate,
      endDate,
      relatedUrl = '',
      feedbackItem = '',
      feedbackUrl = '',
      feedbackMoney = 0,
      feedbackDate
    } = req.body

    const requiredError: string[] = requiredRules({
      req,
      params: [
        'userId',
        'teamName',
        'email',
        'phone',
        'title',
        'categoryKey',
        'targetMoney',
        'startDate',
        'endDate',
        'describe',
        'coverUrl',
        'content'
      ],
      messageArea: 'project'
    })
    if (requiredError.length) {
      return next(
        globalError({
          errMessage: requiredError[0]
        })
      )
    }
    // 提案類型錯誤
    if (![1, 2, 3, 4, 5, 6].includes(categoryKey)) {
      return next(
        globalError({
          errMessage: '提案類型錯誤'
        })
      )
    }
    // 日期驗證
    if (moment(startDate).isBefore(moment(), 'days') || moment(endDate).isBefore(moment(), 'days')) {
      return next(
        globalError({
          errMessage: '日期不可小於今日'
        })
      )
    }
    if (moment(startDate).diff(moment(), 'days') < 10) {
      return next(
        globalError({
          errMessage: '開始日期不能是 10 日內'
        })
      )
    }

    const user = await User.findById(userId)
    if (!user) {
      return next(
        globalError({
          httpStatus: 404,
          errMessage: '查無此用戶'
        })
      )
    }

    await Project.create({
      userId,
      introduce,
      teamName,
      title,
      email,
      categoryKey,
      phone,
      targetMoney,
      content,
      coverUrl,
      describe,
      videoUrl,
      startDate,
      endDate,
      relatedUrl,
      feedbackItem,
      feedbackUrl,
      feedbackMoney,
      feedbackDate
    })

    responseSuccess.success({
      res,
      body: {
        message: '資料新增成功'
      }
    })
  })
)

export default router
