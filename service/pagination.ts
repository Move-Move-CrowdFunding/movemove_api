import type { paginationOption, paginationReq } from '../interface/pagination'
import type { errorTask } from '../interface/error'

/**
 *
 * @param {*} database 單一資料庫名稱
 * @param {*} option 篩選/排序方法
 * @returns 返回篩選後結果 + 分頁
 */
const pagination = async (database: any, option: paginationOption, req: paginationReq) => {
  return await new Promise(async (resolve, reject) => {
    const { pageSize = 5, pageNo = 1 } = req.body
    const { sort = {}, filter = {} } = option

    const curPage = await database.find(filter).sort(sort).skip(pageSize * (pageNo - 1)).limit(pageSize)
    const totalCount = await database.find(filter).count()
    const totalPage = Math.ceil(totalCount / pageSize)

    const data = {
      data: curPage,
      pagination: {
        totalCount,
        pageNo,
        hasPre: pageNo > 1,
        hasNext: pageNo < totalPage,
        totalPage
      }
    }

    // 當前無資料
    if (!totalCount) {
      resolve(data)
    }

    // 超過頁數
    if (pageNo < 1 || pageNo > totalPage) {
      const err: errorTask = new Error('查無資料')
      err.status = 400
      reject(err)
    }

    resolve(data)
  })
}

module.exports = pagination
