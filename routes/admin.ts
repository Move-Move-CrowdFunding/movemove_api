import express from 'express'
import authMiddleware from '../middleware/authMiddleware'
import checkAdminAuth from '../middleware/checkAdminAuth'
import ProjectModel from '../models/Project'

const router = express.Router()

// 管理端 檔案列表-查詢 API /admin/projects TODO: 分頁功能 搜尋功能 完整的提案資料
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
      // 搜尋提案編號或標題關鍵字
      let totalProjects = 0
      let filter = {}
      filter = { title: { $regex: search } }
      totalProjects = await ProjectModel.countDocuments(filter)
      if (!totalProjects) {
        filter = { _id: search }
        totalProjects = await ProjectModel.countDocuments(filter)
      }

      // 分頁參數
      const totalPage = Math.ceil(totalProjects / Number(pageSize))
      const safePageNo = Number(pageNo) > totalPage ? 1 : pageNo

      // 條件式查詢
      const projectsData = await ProjectModel.find(filter)
        .populate('userId', 'nickName')
        .skip((Number(safePageNo) - 1) * Number(pageSize))
        .limit(Number(pageSize || 10))
        .sort({ startDate: sort })

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
      message: '伺服器錯誤' + error
    })
  }
})

// 管理端 取得提案內容 API /admin/projects/{project} TODO: 取得完整提案內容功能
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
    await ProjectModel.find({ _id: projectId })
      .populate('userId', 'nickName')
      .then((projectData) => {
        return res.status(200).json({
          status: 'success',
          message: '取得提案資料成功',
          results: projectData
        })
      })
  } catch (error) {
    return res.status(404).json({
      status: 'error',
      message: '找不到此提案'
    })
  }
})

export default router
