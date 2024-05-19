import express, { Request, Response, NextFunction } from 'express'
import type { paginationOption, paginationReq, paginationData } from '../interface/pagination'
import tokenInfo from '../interface/tokenInfo'
import projectType from '../interface/project'
import { Types } from 'mongoose'

import catchAll from '../service/catchAll'
import requiredRules from '../utils/requiredRules'
import globalError from '../service/globalError'
import responseSuccess from '../service/responseSuccess'

import pagination from '../utils/pagination'
import createCheck from '../utils/createCheck'

import parseToken from '../middleware/parseToken'
import authMiddleware from '../middleware/authMiddleware'

import Project from '../models/Project'
import User from '../models/User'
import Sponsor from '../models/Sponsor'
import Track from '../models/Track'
import Check from '../models/Check'
import moment from 'moment'
const router = express.Router()

// 提案列表

router.get(
  '/',
  parseToken,
  catchAll(async (req: paginationReq, res: Response, next: NextFunction) => {
    /**
     * #swagger.tags = ['Projects - 提案']
     * #swagger.description = '提案列表'
     * #swagger.parameters['pageNo'] = {
       in: 'query',
       description: '當前第幾頁',
       type: 'number',
       default: '1'
     }
     * #swagger.parameters['pageSize'] = {
       in: 'query',
       description: '一頁有幾筆',
       type: 'number',
       default: '10'
     }
     * #swagger.parameters['categoryKey'] = {
       in: 'query',
       description: '提案分類: 0-全部 1-教育 2-弱勢救助 3-國際支援 4-兒少福利 5-長者 6-婦女',
       type: 'number',
       default: '0',
     }
     * #swagger.parameters['isExpired'] = {
       in: 'query',
       description: '是否包含已結束募資的提案',
       type: 'boolean',
       default: 'false'
     }
     * #swagger.parameters['sort'] = {
       in: 'query',
       description: '頁面排序: 1-由新到舊 2-由舊到新',
       type: 'number',
       default: '1',
     }
     * #swagger.parameters['keyword'] = {
       in: 'query',
       description: '關鍵字查詢',
       type: 'string'
     }
     * #swagger.responses[200] = {
        description: '取得募資列表成功',
        schema: {
          "status": "success",
          "message": "取得募資列表成功",
          "results": [
          {
            "id": "663a5750e34b6703e22a9f60",
            "introduce": "專業金援團隊，弱勢族群救星，幫助許多需要協助的家庭。",
            "teamName": "弱勢救星",
            "email": "nomail@mail.com",
            "phone": "0938938438",
            "title": "第二筆提案",
            "categoryKey": 2,
            "targetMoney": 50000,
            "startDate": 1718121600,
            "endDate": 1718985600,
            "describe": "一場無情的大火吞噬了整個社區，請幫助無家可歸的民眾。",
            "coverUrl": "https://fakeimg.pl/300/",
            "content": "<p>test</p>",
            "videoUrl": "",
            "relatedUrl": "",
            "feedbackItem": "限量精美小熊維尼",
            "feedbackUrl": "https://fakeimg.pl/300/",
            "feedbackMoney": 100,
            "feedbackDate": 1682524800,
            "achievedMoney": 0,
            "trackingStatus": false
          }
        ],
        "pagination": {
          "count": 1,
          "pageNo": 1,
          "pageSize": 10,
          "hasPre": false,
          "hasNext": false,
          "totalPage": 1
        }
        },
       }
     * #swagger.responses[404] = {
        description: '取得列表失敗',
        schema: {
          "status": "error",
          "message": "無此分頁"
        },
       }
     *
     */

    const { categoryKey = 0, isExpired = 'false', sort = 1, keyword = '' } = req.query

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
      select: {
        userId: 0,
        createTime: 0,
        updateTime: 0
      },
      lookup: {
        from: 'sponsors',
        localField: '_id',
        foreignField: 'projectId',
        as: 'sponsorList'
      },
      lookup1: {
        from: 'tracks',
        localField: '_id',
        foreignField: 'projectId',
        as: 'trackList'
      },
      lookup2: {
        from: 'checks',
        localField: '_id',
        foreignField: 'projectId',
        as: 'checkList',
        pipeline: [{ $match: { status: 1 } }]
      },
      match: {
        'checkList.0': { $exists: true }
      }
      // populate: {
      //   path: 'userId'
      // }
    }
    if (!JSON.parse(isExpired as string)) {
      // 篩掉過期的提案
      if (option.filter) {
        option.filter.endDate = { $gt: Math.ceil(Date.now() / 1000) }
      } else {
        option.filter = { endDate: { $gt: Math.ceil(Date.now() / 1000) } }
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
    if (!pageData) {
      return next(
        globalError({
          errMessage: '資料讀取錯誤'
        })
      )
    }

    responseSuccess.success({
      res,
      body: {
        message: '取得募資列表成功',
        ...pageData,
        pagination: {
          ...pageData.pagination
          // count: checkSet.length,
          // hasPre: Number(pageNo) > 1,
          // hasNext: Number(pageNo) < totalPage,
          // totalPage
        }
      }
    })
  })
)

// 獲取單一提案
router.get(
  '/:id',
  parseToken,
  catchAll(async (req: paginationReq, res: Response, next: NextFunction) => {
    /**
     * #swagger.tags = ['Projects - 提案']
     * #swagger.description = '單一提案內容'
     * #swagger.parameters['id'] = {
        in: 'path',
        description: '提案 id'
       }
     * #swagger.responses[200] = {
        description: '單一提案獲取成功',
        schema: {
          "status": "success",
          "message": "取得募資列表成功",
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
            "trackingStatus": true
          }
        }
      }
      * #swagger.responses[404] = {
        description: '取得提案失敗',
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
      {
        $lookup: {
          from: 'sponsors',
          localField: '_id',
          foreignField: 'projectId',
          as: 'sponsorList'
        }
      },
      {
        $lookup: {
          from: 'tracks',
          localField: '_id',
          foreignField: 'projectId',
          as: 'trackList'
        }
      },
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
        sponsorList,
        trackList,
        checkList
      } = data[0]

      if (!userId.equals(new Types.ObjectId(req.payload.id)) && !checkList.some((check: any) => check.status === 1)) {
        // 不可查看未審核通過的提案
        return next(
          globalError({
            httpStatus: 404,
            errMessage: '查無此提案'
          })
        )
      }

      const results: any = {
        id: _id,
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
        achievedMoney: sponsorList.reduce((num: number, sponsor: any) => num + Number(sponsor.money), 0),
        supportCount: sponsorList.length,
        trackingStatus:
          req.isLogin && !!trackList.find((track: any) => track.userId.equals(new Types.ObjectId(req.payload.id)))
      }

      responseSuccess.success({
        res,
        body: {
          message: '資料取得成功',
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

// 發起提案
router.post(
  '/',
  authMiddleware,
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
    const feedbackTimer = String(feedbackDate).padEnd(13, '0')

    if (moment(Number(endTimer)).isBefore(moment(Number(startTimer)))) {
      return next(
        globalError({
          errMessage: '結束時間不可小於開始時間'
        })
      )
    }

    if (
      moment(Number(startTimer)).isBefore(moment(), 'days') ||
      moment(Number(endTimer)).isBefore(moment(), 'days') ||
      moment(Number(feedbackTimer)).isBefore(moment(), 'days')
    ) {
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

    const user = await User.findById((req as tokenInfo).user.id)
    if (!user) {
      return next(
        globalError({
          httpStatus: 404,
          errMessage: '查無此用戶'
        })
      )
    }

    const project = await Project.create({
      userId: (req as tokenInfo).user.id,
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
      startDate: Number(startTimer.substring(0, 10)),
      endDate: Number(endTimer.substring(0, 10)),
      relatedUrl,
      feedbackItem,
      feedbackUrl,
      feedbackMoney,
      feedbackDate
    })

    const checkData = await createCheck({
      projectId: project._id,
      content: '',
      status: 0,
      next
    })

    if (!checkData) {
      await Project.findByIdAndDelete(project._id)
      return next(
        globalError({
          httpStatus: 404,
          errMessage: '資料新增失敗'
        })
      )
    }

    responseSuccess.success({
      res,
      body: {
        message: '資料新增成功'
      }
    })
  })
)

// 修改提案
router.patch(
  '/:id',
  authMiddleware,
  catchAll(async (req: Request, res: Response, next: NextFunction) => {
    /**
     * #swagger.tags = ['Projects - 提案']
     * #swagger.description = '修改提案'
     * #swagger.security = [{
        token: []
       }]
     * #swagger.parameters['body'] = {
        in: 'body',
        description: '修改提案格式',
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
          feedbackDate: 1682524800,
          earlyEnd: false
        }
       }
     * #swagger.responses[200] = {
        description: '修改提案成功',
        schema: {
          "status": "success",
          "message": "修改提案成功"
        },
       }
     * #swagger.responses[400] = {
        description: '修改提案失敗',
        schema: {
          "status": "error",
          "message": "請輸入提案標題"
        },
       }
     *
     */
    const projectId = req.params.id

    const projectData: projectType | null = await Project.findById(projectId)

    if (!projectData) {
      return next(
        globalError({
          httpStatus: 404,
          errMessage: '查無此提案'
        })
      )
    }
    if (projectData.userId && !projectData.userId.equals(new Types.ObjectId((req as tokenInfo).user.id))) {
      return next(
        globalError({
          httpStatus: 403,
          errMessage: '身分驗證錯誤,請重新登入'
        })
      )
    }

    if (projectData && projectData.endDate < Math.ceil(Date.now() / 1000)) {
      return next(
        globalError({
          errMessage: '該提案已結束'
        })
      )
    }

    const {
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
      feedbackDate,
      earlyEnd = false // 是否提早結束
    } = req.body

    const requiredError: string[] = requiredRules({
      req,
      params: [
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
    const feedbackTimer = String(feedbackDate).padEnd(13, '0')

    if (moment(Number(endTimer)).isBefore(moment(Number(startTimer)))) {
      return next(
        globalError({
          errMessage: '結束時間不可小於開始時間'
        })
      )
    }

    if (
      moment(Number(startTimer)).isBefore(moment(), 'days') ||
      moment(Number(endTimer)).isBefore(moment(), 'days') ||
      moment(Number(feedbackTimer)).isBefore(moment(), 'days')
    ) {
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

    await Project.findByIdAndUpdate(projectId, {
      userId: (req as tokenInfo).user.id,
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
      startDate: Number(startTimer.substring(0, 10)),
      endDate: earlyEnd ? Math.ceil(Date.now() / 1000) : Number(endTimer.substring(0, 10)),
      relatedUrl,
      feedbackItem,
      feedbackUrl,
      feedbackMoney,
      feedbackDate
    })

    const checkData = await createCheck({
      projectId: projectData._id,
      content: '',
      status: 0,
      next
    })

    if (!checkData) {
      return next(
        globalError({
          httpStatus: 400,
          errMessage: '修改提案失敗'
        })
      )
    }

    responseSuccess.success({
      res,
      body: {
        message: '修改提案成功'
      }
    })
  })
)

// 測試用 API
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

// router.post(
//   '/test',
//   catchAll(async (req: paginationReq, res: Response) => {
//     await Check.create({ ...req.body })
//     responseSuccess.success({
//       res,
//       body: {
//         message: '成功'
//       }
//     })
//   })
// )

export default router
