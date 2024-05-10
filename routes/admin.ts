import express from 'express'
import authMiddleware from '../middleware/authMiddleware'
import checkAdminAuth from '../middleware/checkAdminAuth'

const router = express.Router()

// 管理端 檔案列表-查詢 API /admin/projects
router.get('/projects', authMiddleware, checkAdminAuth, async (req, res) => {
  /**
   * #swagger.tags = ['Admin - 管理端']
   * #swagger.description = '取得提案列表'
   * #swagger.security = [{
      token: []
    }]
  * #swagger.responses[200] = {
    description: '取得提案列表成功',
    schema: {
        "status": "success",
        "message": "取得提案列表",
        "results": [
            {
              "id": "_NDWQODQ123DSWA",
              "coverUrl": "https://sample.url/picture.png",
              "title": "樂知修繕隊緊急求援|弱勢助弱勢,修家修心不能停",
              "startDate": 1728492012,
              "endDate": 1728492012,
              "targetMoney": 100000,
              "countMoney": 500,
              "nickName": "弱勢救星",
              "status": 0
            }
          ],
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
    // if (!auth) {
    //   res.status(401).json({
    //     status: 'error',
    //     message: '身分驗證失敗，請重新登入'
    //   })
    // } else {
    //   const token = String(auth).replace('Bearer ', '')
    //   try {
    //     await verifyJWTtoken(token)
    //     res.status(200).json({
    //       status: 'success',
    //       message: '登入成功'
    //     })

    // 請求參數檢查
    const errorMsg = []
    /*
      pageNo 當前頁數（預設1）
      pageSize 單頁筆數（預設10）
      sortDesc 提案新舊排序（預設false）
      status 提案狀態
      search 搜尋提案關鍵字或編號
    */
    const { pageNo = 1, pageSize = 10, sortDesc = 'false', status = 0, search = '' } = req.query

    // 當前頁數
    if (!Number(pageNo)) {
      errorMsg.push('當前頁數錯誤')
    }

    // 單頁筆數
    if (!Number(pageSize)) {
      errorMsg.push('單頁筆數錯誤')
    }

    // 提案新舊排序
    if (!['true', 'false'].includes(String(sortDesc))) {
      errorMsg.push('提案新舊排序錯誤')
    }

    // 提案狀態錯誤 （N = 0:[預設]送審 1:核准 -1:否准 2:已結束 3:全部）
    if (![0, 1, -1, 2, 3].includes(Number(status))) {
      errorMsg.push('提案狀態錯誤')
    }

    // 有search參數值則進行搜尋
    if (String(search)) {
      // 若不能則搜尋提案關鍵字
    }

    if (errorMsg.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: '提案列表取得成功',
        results: [
          {
            id: '_NDWQODQ123DSWA',
            coverUrl: 'https://sample.url/picture.png',
            title: '樂知修繕隊緊急求援|弱勢助弱勢,修家修心不能停',
            startDate: 1728492012,
            endDate: 1728492012,
            targetMoney: 100000,
            countMoney: 500,
            nickName: '弱勢救星',
            status: 0
          }
        ],
        pagination: {
          pageNo: 1,
          pageSize: 10,
          totalPage: 3,
          count: 25,
          sortDesc: false,
          status: 0,
          search: '關鍵字搜尋'
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

export default router
