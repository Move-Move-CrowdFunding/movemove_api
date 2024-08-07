import express, { Response, NextFunction } from 'express'
import { Types } from 'mongoose'
import bcrypt from 'bcrypt'

import type { paginationOption, paginationReq, paginationData } from '../interface/pagination'
import catchAll from '../service/catchAll'
import globalError from '../service/globalError'
import responseSuccess from '../service/responseSuccess'
import pagination from '../utils/pagination'
import WS from '../connections/websocket'

import authMiddleware from '../middleware/authMiddleware'

import Project from '../models/Project'
import User from '../models/User'
import Check from '../models/Check'
import Sponsor from '../models/Sponsor'
import Track from '../models/Track'
import Notification from '../models/Notification'

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
        reviewLog: checkList
          .sort((a: any, b: any) => a.createTime - b.createTime)
          .map((check: any) => ({
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

// 我的提案列表
router.get('/projects', authMiddleware, async (req, res) => {
  /**
     * #swagger.tags = ['Member - 會員中心']
     * #swagger.description = '我的提案列表'
     * #swagger.security = [{
        token: []
       }]
    * #swagger.parameters['state'] = {
      in: 'query',
      description: '提案狀態 （N = 0:送審 1:[預設]核准 -1:否准 2:已結束）',
      type: 'number',
      default: '1'
    }
    * #swagger.parameters['pageNo'] = {
      in: 'query',
      description: '當前頁數',
      type: 'number',
      default: '1'
    }
    * #swagger.parameters['pageSize'] = {
      in: 'query',
      description: '單頁筆數',
      type: 'number',
      default: '10'
    }

     * #swagger.responses[200] = {
        description: '取得我的提案列表成功',
        schema: {
          "status": "success",
          "message": "取得我的提案列表成功",
          "results": {
            "eachStateCount": {
              "ongoing": 3,
              "pending": 2,
              "rejected": 1,
              "ended": 0
            },
            "list": [
              {
                "id":"66401d4618d9a03d5819470a",
                "title": "支持烏野再次踏上東京橘色球場",
                "categoryKey": 1,
                "targetMoney": 100000,
                "achievedMoney":4000,
                "startDate": 1715792000,
                "endDate": 1732384000,
                "coverUrl": "https://i.imgur.com/UqUdehL.png",
                "sponsorCount": 4,
                "feedbackItem": "手繪感謝小卡",
                "feedbackMoney": 1000
              }
            ]
          },

          "pagination": {
            "pageNo": 1,
            "pageSize": 10,
            "count": 3
          }
        }
      }
      * #swagger.responses[400] = {
        description: '發生錯誤',
        schema: {
          "status": "error",
          "message": "發生錯誤"
        },
      }
      * #swagger.responses[500] = {
        description: '伺服器錯誤',
        schema: {
          "status": "error",
          "message": "伺服器錯誤"
        },
      }
     */
  try {
    const userId = (req as any).user.id

    // 請求參數檢查
    const errorMsg = []
    const { pageNo = 1, pageSize = 10, state = 1 } = req.query

    // 當前頁數
    if (!Number(pageNo) || Number(pageNo) < 1) {
      errorMsg.push('當前頁數錯誤')
    }

    // 單頁筆數
    if (!Number(pageSize) || Number(pageSize) < 1) {
      errorMsg.push('單頁筆數錯誤')
    }

    // 提案狀態 （N = 0:[預設]送審 1:ongoing -1:rejected 2:已結束）
    if (![0, 1, -1, 2].includes(Number(state))) {
      errorMsg.push('提案狀態錯誤')
    }

    if (errorMsg.length) {
      return res.status(400).json({
        status: 'error',
        message: `發生錯誤 ${errorMsg.join()}`
      })
    }

    const allProjects = await Project.aggregate([
      {
        $match: { userId: new Types.ObjectId(userId) }
      },
      {
        $lookup: {
          from: 'checks',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$projectId', '$$projectId']
                }
              }
            },
            { $sort: { updateTime: 1 } } // 審核紀錄由舊到新排序
          ],
          as: 'reviewLog'
        }
      },
      {
        $addFields: {
          reviewLog: {
            $map: {
              input: '$reviewLog',
              as: 'check',
              in: {
                $mergeObjects: ['$$check', { timestamp: '$$check.updateTime' }]
              }
            }
          }
        }
      },
      {
        $addFields: {
          latestCheck: { $arrayElemAt: ['$reviewLog', -1] }
        }
      },
      {
        $addFields: {
          state: '$latestCheck.status'
        }
      },
      { $unwind: '$state' },
      {
        $project: {
          latestCheck: 0,
          reviewLog: 0,
          userId: 0,
          introduce: 0,
          teamName: 0,
          email: 0,
          phone: 0,
          describe: 0,
          content: 0,
          videoUrl: 0,
          relatedUrl: 0,
          feedbackUrl: 0,
          feedbackDate: 0,
          createTime: 0,
          updateTime: 0
        }
      }
    ])

    const eachStateCount = {
      ongoing: allProjects.filter((obj) => Number(obj.state) === 1 && obj.endDate >= Date.now() / 1000).length,
      rejected: allProjects.filter((obj) => Number(obj.state) === -1).length,
      pending: allProjects.filter((obj) => Number(obj.state) === 0).length,
      ended: allProjects.filter((obj) => Number(obj.state) === 1 && obj.endDate < Date.now() / 1000).length
      // total: allProjects.length,
      // allProjects,
      // now: Date.now()/1000
    }
    let totalProjects = 0
    switch (Number(state)) {
      case 1:
        totalProjects = eachStateCount.ongoing
        break
      case 0:
        totalProjects = eachStateCount.pending
        break
      case -1:
        totalProjects = eachStateCount.rejected
        break
      case 2:
        totalProjects = eachStateCount.ended
        break
    }

    const totalPage = Math.ceil(totalProjects / Number(pageSize))
    const safePageNo = Number(pageNo) > totalPage ? 1 : pageNo

    // 提案狀態查詢邏輯
    let stateFilter = {}
    switch (Number(state)) {
      case 0:
        stateFilter = { 'latestCheck.status': 0 }
        break
      case 1:
        stateFilter = { 'latestCheck.status': 1, endDate: { $gte: Date.now() / 1000 } }
        break
      case -1:
        stateFilter = { 'latestCheck.status': -1 }
        break
      case 2:
        stateFilter = { 'latestCheck.status': 1, endDate: { $lt: Date.now() / 1000 } }
        break
    }

    const list = await Project.aggregate([
      {
        $match: { userId: new Types.ObjectId(userId) }
      },
      {
        $lookup: {
          from: 'checks',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$projectId', '$$projectId']
                }
              }
            },
            { $sort: { updateTime: 1 } } // 審核紀錄由舊到新排序
          ],
          as: 'reviewLog'
        }
      },
      {
        $addFields: {
          reviewLog: {
            $map: {
              input: '$reviewLog',
              as: 'check',
              in: {
                $mergeObjects: ['$$check', { timestamp: '$$check.updateTime' }]
              }
            }
          }
        }
      },
      {
        $addFields: {
          latestCheck: { $arrayElemAt: ['$reviewLog', -1] }
        }
      },
      {
        $addFields: {
          state: '$latestCheck.status'
        }
      },
      { $unwind: '$state' },
      {
        $project: {
          // latestCheck: 0,
          reviewLog: 0,
          userId: 0,
          introduce: 0,
          teamName: 0,
          email: 0,
          phone: 0,
          describe: 0,
          content: 0,
          videoUrl: 0,
          relatedUrl: 0,
          feedbackUrl: 0,
          feedbackDate: 0,
          createTime: 0,
          updateTime: 0
        }
      },

      { $match: stateFilter },
      { $skip: (Number(safePageNo) - 1) * Number(pageSize) },
      { $limit: Number(pageSize) },
      {
        $lookup: {
          from: 'sponsors',
          let: { projectId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$projectId', '$$projectId']
                }
              }
            }
          ],
          as: 'sponsorLog'
        }
      },
      {
        $addFields: {
          sponsorLog: {
            $map: {
              input: '$sponsorLog',
              as: 'sponsor',
              in: {
                $mergeObjects: ['$$sponsor']
              }
            }
          }
        }
      },
      {
        $addFields: {
          id: '$_id',
          achievedMoney: { $sum: '$sponsorLog.money' },
          sponsorCount: { $size: '$sponsorLog' }
        }
      },
      {
        $project: {
          sponsorLog: 0,
          _id: 0,
          state: 0,
          latestCheck: 0
        }
      }
    ])

    return res.status(200).json({
      status: 'success',
      message: totalProjects ? '提案列表取得成功' : '找不到相符條件的資料',
      results: {
        eachStateCount,
        list
      },
      pagination: {
        pageNo: Number(safePageNo),
        pageSize: Number(pageSize),
        count: totalProjects
      }
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤'
    })
  }
})

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

    const userData = await User.findOne({ _id: id })
    if (userData) {
      const isPasswordValid = await bcrypt.compare(`${oldPassword}`, userData.password)
      if (isPasswordValid) {
        const newPasswordHashed = await bcrypt.hash(newPassword, 10)
        await User.findByIdAndUpdate(id, { password: newPasswordHashed }).then(() => {
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

// 用戶端 追蹤、退追提案 POST /member/collection
router.post('/collection', authMiddleware, async (req, res) => {
  /**
   * #swagger.tags = ['Member - 會員中心']
   * #swagger.description = '追蹤或取消追蹤提案'
   * #swagger.security = [{
      token: []
    }]
  * #swagger.parameters['body'] = {
    in: 'body',
    description: '要追蹤或取消追蹤的提案編號',
    type: 'object',
    required: true,
    schema: {
      "projectId": "66401d4618d9a03d581946fc"
    }
  }
  * #swagger.responses[200] = {
    description: '狀態更新成功',
    schema: {
      "status": "success",
      "message": "狀態更新成功"
    }
  }
  *
  */

  try {
    const { id } = (req as any).user
    const { projectId } = req.body

    // 檢查提案編號
    if (Types.ObjectId.isValid(String(projectId))) {
      const projectData = await Project.findById(projectId)
      if (!projectData) {
        return res.status(404).json({
          status: 'error',
          message: '無此提案'
        })
      }

      // 已追蹤的提案則刪除追蹤
      const trackFilter = { userId: id, projectId }
      const trackData = await Track.find(trackFilter)
      let trackTodo = ''
      if (trackData.length > 0) {
        await Track.deleteMany(trackFilter)
        trackTodo = '-已退追'
      } else {
        await Track.create(trackFilter)
        trackTodo = '-已追蹤'
      }

      return res.status(200).json({
        status: 'success',
        message: '狀態更新成功' + trackTodo
      })
    } else {
      return res.status(400).json({
        status: 'error',
        message: '請檢查提案編號'
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤'
    })
  }
})

// 用戶端 追蹤列表 GET /member/collection
router.get('/collection', authMiddleware, async (req, res) => {
  /**
   * #swagger.tags = ['Member - 會員中心']
   * #swagger.description = '取得追蹤列表'
   * #swagger.security = [{
      token: []
    }]
    * #swagger.parameters['pageNo'] = {
      in: 'query',
      description: '當前頁數',
      type: 'number',
      default: '1'
    }
    * #swagger.parameters['pageSize'] = {
      in: 'query',
      description: '單頁筆數',
      type: 'number',
      default: '10'
    }
  * #swagger.responses[200] = {
    description: '取得追蹤列表成功',
    schema: {
      "status": "success",
      "message": "取得追蹤列表成功",
      "results": [{
        "_id": "66401d4618d9a03d581946fd",
        "userId": "663a54b8c9225d0f16b55020",
        "introduce": "災害應變知識應該是公開的，邀請你一起降低公民參與門檻，製作「免費線上手冊」，讓所有人都能隨時取得、自學練習，隨時做好災害應變準備，保護自己與身邊的人。 壯闊台灣聯盟是獨立的非營利組織，工作圍繞著提升國家韌性、社會安全、民主治理與整體競爭力。Take action today - 成為彼此的後盾！",
        "teamName": "愛在西元前",
        "email": "elsa@gamil.com",
        "phone": "0955123123",
        "title": "壯闊台灣開源計畫｜公開災害應變知識，一起自主學習！",
        "categoryKey": 1,
        "targetMoney": 500000,
        "startDate": 1715439897,
        "endDate": 1718118294,
        "describe": "公開災害應變知識，一起自主學習！",
        "coverUrl": "https://picsum.photos/id/61/200/300",
        "content": "<p>最近一次地震發生時，你還記得你的反應是什麼嗎？無論自己是當事人或只是旁觀者，上次遇到事故，你第一時間的反應又是什麼？面對無法預期的突發狀況，唯有最好準備，才能保護身邊的人。<br><br>台灣地理與地緣政治環境特殊，我們面臨各種天災與人為的風險，事情發生當下沒有思考的時間，#BePrepared !<br><br>邀請你，支持「壯闊台灣開源計畫｜公開災害應變知識，一起自主學習！」，提供免費線上手冊、讓學習與取用沒有侷限，讓更多人有能力在關鍵時刻伸出援手。</p>",
        "videoUrl": "https://youtu.be/Iy69ifIf7jc?si=rX3_ZAdEhvgsUbu5",
        "relatedUrl": "www.google.com",
        "feedbackItem": "止血帶包",
        "feedbackUrl": "",
        "feedbackMoney": 10000,
        "feedbackDate": 1718118294,
        "trackingStatus": true
      }],
      "pagination": {
        "pageNo": 1,
        "pageSize": 10,
        "hasNext": false,
        "hasPre": false,
        "totalPage": 1,
        "count": 1
      }
    }
  }
  *
  */

  try {
    // 請求參數檢查
    const errorMsg = []
    const { id } = (req as any).user
    const { pageNo = 1, pageSize = 10 } = req.query

    // 當前頁數
    if (!Number(pageNo) || Number(pageNo) < 1) {
      errorMsg.push('當前頁數錯誤')
    }

    // 單頁筆數
    if (!Number(pageSize) || Number(pageSize) < 1) {
      errorMsg.push('單頁筆數錯誤')
    }

    if (errorMsg.length === 0) {
      const trackFilter = { userId: new Types.ObjectId(id) }
      const totalTracks = await Track.countDocuments(trackFilter)
      const totalPage = Math.ceil(totalTracks / Number(pageSize))
      const safePageNo = Number(pageNo) > totalPage ? 1 : pageNo

      const tracks = await Track.aggregate([
        { $match: trackFilter },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'project'
          }
        },
        { $unwind: '$project' },
        { $replaceRoot: { newRoot: '$project' } },
        { $addFields: { trackingStatus: true } },
        { $skip: (Number(safePageNo) - 1) * Number(pageSize) },
        { $limit: Number(pageSize) }
      ])

      return res.status(200).json({
        status: 'success',
        message: totalTracks ? '取得追蹤列表成功' : '還沒有追蹤的提案',
        results: tracks,
        pagination: {
          pageNo: Number(safePageNo),
          pageSize: Number(pageSize),
          hasNext: Number(safePageNo) < totalPage,
          hasPre: Number(safePageNo) > 1,
          totalPage,
          count: totalTracks
        }
      })
    } else {
      return res.status(400).json({
        status: 'error',
        message: `發生錯誤 ${errorMsg.join()}`
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤' + error
    })
  }
})

// 我的通知
router.get(
  '/notification',
  authMiddleware,
  catchAll(async (req: paginationReq, res: Response, next: NextFunction) => {
    /**
     * #swagger.tags = ['Member - 會員中心']
     * #swagger.description = '取得未讀通知數量'
     * #swagger.security = [{
        token: []
      }]
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
     * #swagger.responses[200] = {
        description: '取得最新通知成功',
        schema: {
          "status": "success",
          "message": "取得未讀通知成功",
          "results": [{
              "id": "664cc9c63171e09ae23b2c9e",
              "content": "「測試修改送審」審核已過審",
              "isRead": true,
              "createTime": 1716308422,
              "project": {
                  "id": "66403c34b00d1fe281742a62",
                  "title": "測試修改送審",
                  "coverUrl": "https://fakeimg.pl/300/",
                  "userId":''
              }
            }],
          "pagination": {
            "count": 2,
            "pageNo": 1,
            "pageSize": 10,
            "hasPre": false,
            "hasNext": false,
            "totalPage": 1
          },
        }
      }
      * #swagger.responses[401] = {
        description: 'token 已失效，請重新登入',
        schema: {
          "status": "error",
          "message": "token 已失效，請重新登入"
        },
      }
     */
    const option: paginationOption = {
      filter: {
        userId: new Types.ObjectId(req.user.id)
      },
      sort: {
        createTime: -1
      },
      set: {
        isRead: true
      },
      populate: {
        path: 'projectId'
      }
    }

    const pageData: void | paginationData = await pagination({
      database: Notification,
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

    await Notification.updateMany(
      { _id: { $in: pageData.results.map((item) => item._id) } },
      { $set: { isRead: true } }
    )

    WS.getUnRead({ socket: req.app.io, io: req.app.server, token: req.token })

    const results = pageData.results.map((item: any) => ({
      id: item._id,
      content: item.content,
      isRead: item.isRead,
      createTime: item.createTime,
      project: {
        id: item.projectId?._id,
        title: item.projectId?.title,
        coverUrl: item.projectId?.coverUrl,
        userId: item.projectId?.userId
      }
    }))

    responseSuccess.success({
      res,
      body: {
        message: '取得最新通知成功',
        ...pageData,
        results
      }
    })
  })
)
// 用戶端 贊助紀錄 GET /member/support
router.get('/support', authMiddleware, async (req, res) => {
  /**
   * #swagger.tags = ['Member - 會員中心']
   * #swagger.description = '取得贊助紀錄'
   * #swagger.security = [{
      token: []
    }]
    * #swagger.parameters['pageNo'] = {
      in: 'query',
      description: '當前頁數',
      type: 'number',
      default: '1'
    }
    * #swagger.parameters['pageSize'] = {
      in: 'query',
      description: '單頁筆數',
      type: 'number',
      default: '10'
    }
  * #swagger.responses[200] = {
    description: '取得贊助紀錄成功',
    schema: {
      "status": "success",
      "message": "取得贊助紀錄成功",
      "results": [{
        "_id": "665876fe0200b4355521bd0c",
        "money": 12000,
        "isNeedFeedback": true,
        "receiver": "Hank林",
        "receiverPhone": "0987987987",
        "address": "台北市大馬路123號",
        "createTime": 1716181992,
        "updateTime": 1716181992,
        "email": "hank@gmail.com",
        "categoryKey": 1,
        "feedBackDate": 1718118294,
        "project": {
          "_id": "66403c34b00d1fe281742a62",
          "title": "壯闊台灣開源計畫｜公開災害應變知識，一起自主學習！",
          "feedbackItem": "止血帶包",
          "categoryKey": 1
        }
      }],
      "pagination": {
        "pageNo": 1,
        "pageSize": 10,
        "hasNext": false,
        "hasPre": false,
        "totalPage": 1,
        "count": 1
      }
    }
  }
  *
  */

  try {
    // 請求參數檢查
    const errorMsg = []
    const { id } = (req as any).user
    const { pageNo = 1, pageSize = 10 } = req.query

    // 當前頁數
    if (!Number(pageNo) || Number(pageNo) < 1) {
      errorMsg.push('當前頁數錯誤')
    }

    // 單頁筆數
    if (!Number(pageSize) || Number(pageSize) < 1) {
      errorMsg.push('單頁筆數錯誤')
    }

    if (errorMsg.length === 0) {
      const sponsorFilter = { userId: new Types.ObjectId(id) }
      const totalSponsors = await Sponsor.countDocuments(sponsorFilter)
      const totalPage = Math.ceil(totalSponsors / Number(pageSize))
      const safePageNo = Number(pageNo) > totalPage ? 1 : pageNo

      const sponsors = await Sponsor.aggregate([
        { $match: sponsorFilter },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userId'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'projectId'
          }
        },
        { $unwind: '$projectId' },
        {
          $addFields: {
            email: '$userId.email',
            categoryKey: '$projectId.categoryKey',
            feedBackDate: '$projectId.feedbackDate',
            project: {
              _id: '$projectId._id',
              title: '$projectId.title',
              feedbackItem: '$projectId.feedbackItem',
              categoryKey: '$projectId.categoryKey'
            }
          }
        },
        { $unwind: '$email' },
        {
          $project: {
            userId: 0,
            userName: 0,
            projectId: 0,
            phone: 0
          }
        },
        { $skip: (Number(safePageNo) - 1) * Number(pageSize) },
        { $limit: Number(pageSize) }
      ])

      return res.status(200).json({
        status: 'success',
        message: totalSponsors ? '取得贊助紀錄成功' : '還沒有贊助的提案',
        results: sponsors,
        pagination: {
          pageNo: Number(safePageNo),
          pageSize: Number(pageSize),
          hasNext: Number(safePageNo) < totalPage,
          hasPre: Number(safePageNo) > 1,
          totalPage,
          count: totalSponsors
        }
      })
    } else {
      return res.status(400).json({
        status: 'error',
        message: `發生錯誤 ${errorMsg.join()}`
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤' + error
    })
  }
})

// 用戶端 贊助名單 GET /member/support/{projectId}
router.get('/support/:projectId', authMiddleware, async (req, res) => {
  /**
   * #swagger.tags = ['Member - 會員中心']
   * #swagger.description = '取得贊助名單'
   * #swagger.security = [{
      token: []
    }]
    * #swagger.parameters['pageNo'] = {
      in: 'query',
      description: '當前頁數',
      type: 'number',
      default: '1'
    }
    * #swagger.parameters['pageSize'] = {
      in: 'query',
      description: '單頁筆數',
      type: 'number',
      default: '10'
    }
  * #swagger.responses[200] = {
    description: '取得贊助名單成功',
    schema: {
      "status": "success",
      "message":"取得贊助名單成功",
      "results": [{
        "_id": "665876fe0200b4355521bd0c",
        "money": 12000,
        "isNeedFeedback": true,
        "receiver": "Hank林",
        "receiverPhone": "0987987987",
        "address": "台北市大馬路123號",
        "createTime": 1716181992,
        "updateTime": 1716181992,
        "email": "hank@gmail.com",
        "feedbackMoney": 10000
      }],
      "pagination": {
          "pageNo": 1,
          "pageSize": 10,
          "hasNext": false,
          "hasPre": false,
          "totalPage": 1,
          "count": 1
        }
    }
  }
  *
  */

  try {
    // 請求參數檢查
    const errorMsg = []
    const { pageNo = 1, pageSize = 10 } = req.query
    const projectId = req.params.projectId || 'empty'
    if (!Types.ObjectId.isValid(String(projectId))) {
      return res.status(400).json({
        status: 'error',
        message: '錯誤的提案編號格式'
      })
    }

    // 當前頁數
    if (!Number(pageNo) || Number(pageNo) < 1) {
      errorMsg.push('當前頁數錯誤')
    }

    // 單頁筆數
    if (!Number(pageSize) || Number(pageSize) < 1) {
      errorMsg.push('單頁筆數錯誤')
    }

    if (errorMsg.length === 0) {
      const sponsorFilter = { projectId: new Types.ObjectId(projectId) }
      const totalSponsors = await Sponsor.countDocuments(sponsorFilter)
      const totalPage = Math.ceil(totalSponsors / Number(pageSize))
      const safePageNo = Number(pageNo) > totalPage ? 1 : pageNo

      const sponsor = await Sponsor.aggregate([
        { $match: sponsorFilter },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userId'
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'projectId',
            foreignField: '_id',
            as: 'projectId'
          }
        },
        { $unwind: '$projectId' },
        {
          $addFields: {
            email: '$userId.email',
            feedbackMoney: '$projectId.feedbackMoney'
          }
        },
        { $unwind: '$email' },
        {
          $project: {
            userId: 0,
            userName: 0,
            projectId: 0,
            phone: 0
          }
        },
        { $skip: (Number(safePageNo) - 1) * Number(pageSize) },
        { $limit: Number(pageSize) }
      ])

      return res.status(200).json({
        status: 'success',
        message: totalSponsors ? '取得贊助名單成功' : '還沒有贊助的紀錄',
        results: sponsor,
        pagination: {
          pageNo: Number(safePageNo),
          pageSize: Number(pageSize),
          hasNext: Number(safePageNo) < totalPage,
          hasPre: Number(safePageNo) > 1,
          totalPage,
          count: totalSponsors
        }
      })
    } else {
      return res.status(400).json({
        status: 'error',
        message: `發生錯誤 ${errorMsg.join()}`
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤' + error
    })
  }
})

// 取得未讀通知數量
router.get(
  '/notification/unread',
  authMiddleware,
  catchAll(async (req: paginationReq, res: Response) => {
    /**
     * #swagger.tags = ['Member - 會員中心']
     * #swagger.description = '取得未讀通知數量'
     * #swagger.security = [{
        token: []
      }]
     * #swagger.responses[200] = {
        description: '取得未讀通知成功',
        schema: {
          "status": "success",
          "message": "取得未讀通知成功",
          "results": {
            "count": 3
          }
        }
      }
      * #swagger.responses[401] = {
        description: 'token 已失效，請重新登入',
        schema: {
          "status": "error",
          "message": "token 已失效，請重新登入"
        },
      }
     */
    const unReadCount = await Notification.find({
      userId: req!.user.id,
      isRead: false
    }).countDocuments()

    responseSuccess.success({
      res,
      body: {
        message: '取得未讀通知成功',
        results: {
          count: unReadCount
        }
      }
    })
  })
)

export default router
