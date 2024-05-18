import express from 'express'
import authMiddleware from '../middleware/authMiddleware'
import checkAdminAuth from '../middleware/checkAdminAuth'
import ProjectModel from '../models/Project'
import { Types } from 'mongoose'
import createCheck from '../utils/createCheck'

const router = express.Router()

// 管理端 檔案列表-查詢 GET /admin/projects TODO: 提案狀態搜尋, 加入提案狀態欄位註記
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
      description: '提案新舊排序',
      type: 'boolean',
      default: 'false'
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
        "results": {
            "projects": "...data"
        },
        "pagination": {
            "pageNo": 1,
            "pageSize": 10,
            "totalPage": 3,
            "count": 25,
            "sortDesc": false,
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
    let sort: any = '1'
    // 當前頁數
    if (!Number(pageNo) || Number(pageNo) < 1) {
      errorMsg.push('當前頁數錯誤')
    }

    // 單頁筆數
    if (!Number(pageSize) || Number(pageSize) < 1) {
      errorMsg.push('單頁筆數錯誤')
    }

    // 提案新舊排序
    if (!['true', 'false'].includes(sortDesc.toString())) {
      errorMsg.push('提案新舊排序錯誤')
    } else {
      sort = sortDesc === 'true' ? 1 : -1
    }

    // 提案狀態 （N = 0:[預設]送審 1:核准 -1:否准 2:已結束 3:全部）
    if (![0, 1, -1, 2, 3].includes(Number(status))) {
      errorMsg.push('提案狀態錯誤')
    }

    if (errorMsg.length === 0) {
      // 搜尋與分頁參數
      let filter = {}
      let totalProjects = 0
      filter = { title: { $regex: search } }
      if (Types.ObjectId.isValid(String(search))) {
        filter = { _id: new Types.ObjectId(String(search)) }
      }
      totalProjects = await ProjectModel.countDocuments(filter)
      const totalPage = Math.ceil(totalProjects / Number(pageSize))
      const safePageNo = Number(pageNo) > totalPage ? 1 : pageNo

      // 條件式查詢
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
              },
              {
                $project: { password: 0 }
              }
            ],
            as: 'userId'
          }
        },
        {
          $lookup: {
            from: 'checks',
            localField: '_id',
            foreignField: 'projectId',
            as: 'checkList'
          }
        },
        { $sort: { startDate: sort } },
        { $skip: (Number(safePageNo) - 1) * Number(pageSize) },
        { $limit: Number(pageSize) }
      ])

      return res.status(200).json({
        status: 'success',
        message: '提案列表取得成功',
        results: projectsData,
        pagination: {
          pageNo: Number(safePageNo),
          pageSize: Number(pageSize),
          totalPage,
          count: totalProjects,
          sortDesc: String(sortDesc),
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
router.get('/projects/:projectId', authMiddleware, checkAdminAuth, async (req, res) => {
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
          "projects": "...data"
      }
    }
  }
  *
  */

  try {
    const projectId = req.params.projectId || 'empty'
    const projectData = await ProjectModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(projectId) }
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$userId' }] }
              }
            },
            {
              $project: { password: 0 }
            }
          ],
          as: 'userId'
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

    return res.status(200).json({
      status: 'success',
      message: '取得提案資料成功',
      results: projectData
    })
  } catch (error) {
    return res.status(404).json({
      status: 'error',
      message: '找不到此提案'
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

    // 檢查提案編號
    if (Types.ObjectId.isValid(String(projectId))) {
      const findProjectId = await ProjectModel.findById(projectId)
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
      await createCheck({
        projectId: projectId as any,
        content,
        status: approve,
        next
      })

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
