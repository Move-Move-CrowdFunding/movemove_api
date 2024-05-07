import express, { Request, Response, NextFunction } from 'express'
import type { paginationOption, paginationReq, paginationData } from '../interface/pagination'

import catchAll from '../service/catchAll'
import requiredRules from '../utils/requiredRules'
import globalError from '../service/globalError'
import responseSuccess from '../service/responseSuccess'
import pagination from '../utils/pagination'

import Project from '../models/Project'
import User from '../models/User'
import Sponsor from '../models/Sponsor'

import moment from 'moment'
const router = express.Router()

// 提案列表
router.get(
  '/',
  catchAll(async (req: paginationReq, res: Response, next: NextFunction) => {
    const { categoryKey = 0, isExpired = 'false', sort = 1, keyword = '' } = req.query
    // categoryKey: 0-全部 1-教育 2-弱勢救助 3-國際支援 4-兒少福利 5-長者 6-婦女
    // isExpired 是否須包含已結束募資的提案
    // sort: 1-由新到舊 2-由舊到新

    // 提案類型錯誤
    if (Number(categoryKey) && ![1, 2, 3, 4, 5, 6].includes(Number(categoryKey))) {
      return next(
        globalError({
          errMessage: '提案類型錯誤'
        })
      )
    }
    if (!['true', 'false'].includes(isExpired) || ![1, 2].includes(Number(sort))) {
      return next(
        globalError({
          errMessage: '參數錯誤'
        })
      )
    }

    // 分頁篩選參數
    const option: paginationOption = {
      filter: {
        title: new RegExp(String(keyword), 'g')
      },
      sort: {
        startDate: Number(sort) === 1 ? -1 : 1
      },
      select: '-userId -createTime -updateTime'
    }
    if (!JSON.parse(isExpired as string)) {
      if (option.filter) {
        option.filter.endDate = { $gt: Date.now() / 1000 }
      } else {
        option.filter = { endDate: { $gt: Date.now() / 1000 } }
      }
    }
    if (Number(categoryKey)) {
      if (option.filter) {
        option.filter.categoryKey = { $eq: Number(categoryKey) }
      } else {
        option.filter = { categoryKey: { $eq: Number(categoryKey) } }
      }
    }

    const pageData: void | paginationData = await pagination({
      database: Project,
      option,
      req,
      next
    })
    if (!pageData) return
    const results = await Promise.all(
      pageData.results.map(async (item) => {
        const sponsorData = await Sponsor.find({ projectId: item._id })
        console.log('item', item)

        const data = {
          id: item._id,
          ...item._doc
        }
        delete data._id
        return {
          ...data,
          achievedMoney: sponsorData.reduce((num, sponsorItem) => num + Number(sponsorItem.money), 0)
        }
      })
    )

    responseSuccess.success({
      res,
      body: {
        message: '取得募資列表成功',
        ...pageData,
        results
      }
    })
  })
)

// 發起提案 => TODO: middleware
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
    const startTimer = String(startDate).padEnd(13, '0')
    const endTimer = String(endDate).padEnd(13, '0')

    if (moment(Number(endTimer)).isBefore(moment(Number(startTimer)))) {
      return next(
        globalError({
          errMessage: '結束時間不可小於開始時間'
        })
      )
    }

    if (moment(Number(startTimer)).isBefore(moment(), 'days') || moment(Number(endTimer)).isBefore(moment(), 'days')) {
      return next(
        globalError({
          errMessage: '日期不可小於今日'
        })
      )
    }
    if (moment(Number(startTimer)).diff(moment(), 'days') < 10) {
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

router.delete(
  '/all',
  catchAll(async (req: Request, res: Response) => {
    /**
     * #swagger.tags = ['Projects - 提案']
     * #swagger.description = '刪除全部提案(僅刪除假資料使用)'
     * #swagger.responses[200] = {
         description: '全部資料刪除成功',
         schema: {
           "status": "success",
           "message": "全部資料刪除成功"
         }
       }
     */
    await Project.deleteMany()

    responseSuccess.success({
      res,
      body: {
        message: '全部資料刪除成功'
      }
    })
  })
)

export default router
