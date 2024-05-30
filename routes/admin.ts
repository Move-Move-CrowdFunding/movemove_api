import express from 'express'
import authMiddleware from '../middleware/authMiddleware'
import checkAdminAuth from '../middleware/checkAdminAuth'
import ProjectModel from '../models/Project'
import CheckModel from '../models/Check'
import { Types } from 'mongoose'
import createCheck from '../utils/createCheck'
import autoNotification from '../utils/autoNotification'

const router = express.Router()

// 管理端 檔案列表-查詢 GET /admin/projects
router.get('/projects', authMiddleware, checkAdminAuth, async (req, res) => {
  /**
   * #swagger.tags = ['Admin - 管理端']
   * #swagger.description = '取得提案列表'
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
    * #swagger.parameters['sortDesc'] = {
      in: 'query',
      description: '提案新舊排序，預設為 true，也可以用 1、-1 參數<br>true、1 為新到舊排序<br>false、-1 為舊到新排序',
      type: 'boolean',
      default: 'true'
    }
    * #swagger.parameters['status'] = {
      in: 'query',
      description: '提案狀態 （N = 0:[預設]送審 1:核准 -1:否准 2:已結束 3:全部）',
      type: 'number',
      default: '0'
    }
    * #swagger.parameters['search'] = {
      in: 'query',
      description: '提案標題關鍵字或編號',
      type: 'string',
      default: ''
    }
  * #swagger.responses[200] = {
    description: '取得提案列表成功',
    schema: {
        "status": "success",
        "message": "取得提案列表",
        "results": [{
          "_id": "6652d5104fd5c3080e3e5795",
          "introduce": "專業金援團隊，弱勢族群救星，幫助許多需要協助的家庭。",
          "teamName": "弱勢救星",
          "email": "nomail@mail.com",
          "phone": "0938938438",
          "title": "測試送審",
          "categoryKey": 2,
          "targetMoney": 30000,
          "startDate": 1720713600,
          "endDate": 1721577600,
          "describe": "一場無情的大火吞噬了整個社區，請幫助無家可歸的民眾。",
          "coverUrl": "https://fakeimg.pl/300/",
          "content": "<p>test</p>",
          "videoUrl": "",
          "relatedUrl": "",
          "feedbackItem": "限量精美小熊維尼",
          "feedbackUrl": "https://fakeimg.pl/300/",
          "feedbackMoney": 100,
          "feedbackDate": 1721577600,
          "createTime": 1716704528,
          "updateTime": 1716704528,
          "nickName": "",
          "status": 0
        }],
        "pagination": {
            "pageNo": 1,
            "pageSize": 10,
            "totalPage": 1,
            "count": 1,
            "sortDesc": true,
            "status": 0,
            "search": "關鍵字搜尋"
          }
      }
    }
  }
  *
  */

  try {
    // 請求參數檢查
    const errorMsg = []
    const { pageNo = 1, pageSize = 10, sortDesc = 'false', status = 0, search = '' } = req.query
    let sort = 1
    // 當前頁數
    if (!Number(pageNo) || Number(pageNo) < 1) {
      errorMsg.push('當前頁數錯誤')
    }

    // 單頁筆數
    if (!Number(pageSize) || Number(pageSize) < 1) {
      errorMsg.push('單頁筆數錯誤')
    }

    // 提案新舊排序
    if (![1, -1, 'true', 'false'].includes(sortDesc as any)) {
      errorMsg.push('提案新舊排序錯誤')
    } else {
      sort = [-1, 'false'].includes(sortDesc as any) ? -1 : 1
    }

    // 提案狀態 （N = 0:[預設]送審 1:核准 -1:否准 2:已結束 3:全部）
    if (![0, 1, -1, 2, 3].includes(Number(status))) {
      errorMsg.push('提案狀態錯誤')
    }

    if (errorMsg.length === 0) {
      // 搜尋與分頁參數
      let filter = {}
      let totalProjects = 0

      // 提案狀態查詢邏輯
      let statusFilter = {}
      switch (Number(status)) {
        case 0:
          statusFilter = { 'reviewLog.status': 0 }
          break
        case 1:
          statusFilter = { 'reviewLog.status': 1 }
          break
        case -1:
          statusFilter = { 'reviewLog.status': -1 }
          break
        case 2:
          statusFilter = { endDate: { $lt: Date.now() / 1000 } }
          break
      }

      filter = { title: { $regex: search } }
      if (Types.ObjectId.isValid(String(search))) {
        filter = { _id: new Types.ObjectId(String(search)) }
      }

      // 取得符合條件的總筆數
      await ProjectModel.aggregate([
        { $match: filter },
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
              { $sort: { updateTime: -1 } },
              { $limit: 1 }
            ],
            as: 'reviewLog'
          }
        },
        { $unwind: '$reviewLog' },
        { $match: statusFilter },
        {
          $addFields: {
            status: '$reviewLog.status'
          }
        }
      ]).then((results) => {
        totalProjects = results.length
      })

      const totalPage = Math.ceil(totalProjects / Number(pageSize))
      const safePageNo = Number(pageNo) > totalPage ? 1 : pageNo

      // 綜合條件後查詢
      const projectsData = await ProjectModel.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'users',
            let: { userId: '$userId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', { $toObjectId: '$$userId' }] }
                }
              }
            ],
            as: 'userId'
          }
        },
        { $unwind: '$userId' },
        {
          $addFields: {
            nickName: '$userId.nickName'
          }
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
              { $sort: { updateTime: -1 } },
              { $limit: 1 } // 只查最新的審核紀錄
            ],
            as: 'reviewLog'
          }
        },
        { $unwind: '$reviewLog' },
        { $match: statusFilter },
        {
          $addFields: {
            status: {
              $switch: {
                branches: [
                  { case: { $lt: ['$endDate', Date.now() / 1000] }, then: 2 } // 代號2為已結束的提案
                ],
                default: '$reviewLog.status'
              }
            }
          }
        },
        { $unwind: '$status' },
        {
          $project: {
            userId: 0,
            reviewLog: 0
          }
        },
        { $sort: { startDate: sort as any } },
        { $skip: (Number(safePageNo) - 1) * Number(pageSize) },
        { $limit: Number(pageSize) }
      ])

      return res.status(200).json({
        status: 'success',
        message: totalProjects ? '提案列表取得成功' : '找不到相符條件的資料',
        results: projectsData,
        pagination: {
          pageNo: Number(safePageNo),
          pageSize: Number(pageSize),
          totalPage,
          count: totalProjects,
          sortDesc: String(sortDesc),
          status,
          search: String(search)
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
      message: '伺服器錯誤'
    })
  }
})

// 管理端 取得提案內容 GET /admin/projects/{projectId}
router.get('/projects/:projectId', authMiddleware, checkAdminAuth, async (req, res, next) => {
  /**
   * #swagger.tags = ['Admin - 管理端']
   * #swagger.description = '取得提案內容'
   * #swagger.security = [{
      token: []
    }]
  * #swagger.responses[200] = {
    description: '取得提案資料成功',
    schema: {
      "status": "success",
      "message": "取得提案資料成功",
      "results": {
        "_id": "66401d4618d9a03d581946fc",
        "introduce": "大家好，我們是廣福國小六年級資優班的學生，我們希望能透過自己的能力及創意籌得資優班畢旅的資金。 老師教導我們要成為懂得幫助他人的人，所以在每次籌辦活動後我們都會做一件幫助他人的事情！",
        "teamName": "愛在西元前",
        "email": "elsa@gamil.com",
        "phone": "0955123123",
        "title": "六優畢旅自籌計畫—【一趟讓國小資優生實踐自主公益計畫的畢業旅行】",
        "categoryKey": 1,
        "targetMoney": 100000,
        "startDate": 1714534369,
        "endDate": 1715439897,
        "describe": "一輩子只有一次的國小資優生畢業旅行",
        "coverUrl": "https://picsum.photos/id/65/200/300",
        "content": "<p>在資優班情意課課程時，老師剛好上到我們如何「同理他人」，我們想到普通班會去一次畢旅，爸爸媽媽就要負擔4張小朋友左右的費用，如果資優班的畢旅可以靠我們自己的能力籌得經費，那不但可以替爸爸媽媽省錢，也能在過程中學習如何籌畫好一個計劃。<br><br>於是計畫就這麼開始了！<br><br>在大家有共識決定自籌畢旅，在腦力激盪階段，我們把從四年級到現在在資優班學習到的概念拿來推敲一番，四年級情意課學習「事情的一體兩面」、五年級特色課程從「能源議題」出發，結合SDGs聯合國永續發展目標我們學習到能源從哪裡來、省電的重要、什麼是碳排放以及永續的重要性，並執行了「檢視自己一週食衣住行育樂碳排放量」的活動，從中我們學會了關注生活及環保觀念。</p>",
        "videoUrl": "https://youtu.be/Iy69ifIf7jc?si=rX3_ZAdEhvgsUbu5",
        "relatedUrl": "www.google.com",
        "feedbackItem": "學生書寫的電子感謝函",
        "feedbackUrl": "",
        "feedbackMoney": 5000,
        "feedbackDate": 1718118294,
        "reviewLog": [
          {
            "_id": "663e4c59d8b15d4452a72a63",
            "content": "待審核",
            "status": 0,
            "timestamp": 1715358809
          }
        ],
        "state": {
          "state": 2,
          "content": "已結束"
        }
      }
    }
  }
  *
  */

  try {
    const projectId = req.params.projectId || 'empty'
    if (!Types.ObjectId.isValid(String(projectId))) {
      return res.status(400).json({
        status: 'error',
        message: '錯誤的提案編號格式'
      })
    }

    // 先檢查提案是否有審核紀錄，若沒有任何審核與送審紀錄則先補建一筆
    const countProjectCheck = await CheckModel.countDocuments({ projectId })
    if (!countProjectCheck) {
      await createCheck({
        projectId: projectId as any,
        content: '',
        status: 0,
        next
      })
    }

    const projectData = await ProjectModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(projectId) }
      },
      // {
      //   $lookup: {
      //     from: 'users',
      //     let: { userId: '$userId' },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: { $eq: ['$_id', { $toObjectId: '$$userId' }] }
      //         }
      //       },
      //       { $project: { password: 0 } }
      //     ],
      //     as: 'userId'
      //   }
      // },
      // { $unwind: '$userId' },
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
          state: {
            $switch: {
              branches: [{ case: { $lt: ['$endDate', Date.now() / 1000] }, then: { state: 2, content: '已結束' } }],
              default: { state: '$latestCheck.status', content: '$latestCheck.content' }
            }
          }
        }
      },
      { $unwind: '$state' },
      {
        $project: {
          userId: 0,
          latestCheck: 0,
          'reviewLog.projectId': 0,
          'reviewLog.createTime': 0,
          'reviewLog.updateTime': 0
        }
      }
    ])

    if (projectData[0]) {
      return res.status(200).json({
        status: 'success',
        message: '取得提案資料成功',
        results: projectData[0]
      })
    } else {
      return res.status(404).json({
        status: 'error',
        message: '找不到此提案'
      })
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤'
    })
  }
})

// 管理端 審核提案內容 POST /admin/projects/{projectId}
router.post('/projects/:projectId', authMiddleware, checkAdminAuth, async (req, res, next) => {
  /**
   * #swagger.tags = ['Admin - 管理端']
   * #swagger.description = '審核提案內容'
   * #swagger.security = [{
      token: []
    }]
  * #swagger.parameters['body'] = {
    in: 'body',
    description: 'approve: 1 = 核准, -1= 否准 , content: 審核說明(否准時為必填)',
    type: 'object',
    required: true,
    schema: {
      "approve": 1,
      "content": "管理員已核准提案"
    }
  }
  * #swagger.responses[200] = {
    description: '審核提案資料成功',
    schema: {
      "status": "success",
      "message": "審核提案資料成功"
    }
  }
  *
  */

  try {
    const errorMsg = []
    const { approve, content } = req.body
    const projectId = req.params.projectId || 'empty'
    let userId = (req as any).user

    // 檢查提案編號
    if (Types.ObjectId.isValid(String(projectId))) {
      const findProjectId = await ProjectModel.findById(projectId)
      userId = findProjectId?.userId
      if (!findProjectId) {
        return res.status(404).json({
          status: 'error',
          message: '找不到提案'
        })
      }
    } else {
      errorMsg.push('請檢查編號格式')
    }

    // 審核狀態 1 = 核准, -1= 否准
    if (![1, -1].includes(Number(approve))) {
      errorMsg.push('請檢查審核狀態')
    }

    // 審核說明 在approve = -1時為必填
    if (approve === -1 && !content) {
      errorMsg.push('需要審核說明')
    }

    if (errorMsg.length === 0) {
      // 避免重複審核已有核准紀錄的提案
      const findProjectIsChecked = await CheckModel.countDocuments({ projectId, status: 1 })
      if (findProjectIsChecked > 0) {
        return res.status(400).json({
          status: 'error',
          message: '該筆提案已有核准紀錄'
        })
      }

      await createCheck({
        projectId: projectId as any,
        content,
        status: approve,
        next
      })

      const notification = await autoNotification({
        userId,
        projectId: new Types.ObjectId(projectId),
        content: '審核通知「<projectName>」',
        next
      })

      if (!notification) {
        return res.status(400).json({
          status: 'error',
          message: '建立通知時發生錯誤'
        })
      }

      return res.status(200).json({
        status: 'success',
        message: '審核提案資料成功'
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
      message: '伺服器錯誤'
    })
  }
})

export default router
