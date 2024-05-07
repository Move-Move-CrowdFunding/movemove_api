import type { paginationOption, paginationReq } from '../interface/pagination'
import globalError from '../service/globalError'
import { NextFunction } from 'express'

/**
 *
 * @param {*} database 單一資料庫名稱
 * @param {*} option 篩選/排序方法
 * @returns 返回篩選後結果 + 分頁
 */
interface Pagination {
  database: any
  option: paginationOption
  req: paginationReq
  next: NextFunction
}
const pagination = async ({ database, option, req, next }: Pagination) => {
  const pageNo = Number(req.query.pageNo) || 1
  const pageSize = Number(req.query.pageSize) || 10
  // const { pageSize = 5, pageNo = 1 } = req.query
  const { sort = {}, filter = {}, populate, select = '' } = option

  let curPage = await database
    .find(filter)
    .sort(sort)
    .skip(pageSize * (pageNo - 1))
    .limit(pageSize)
    .select(select)

  if (populate) {
    curPage = await database
      .find(filter)
      .sort(sort)
      .skip(pageSize * (pageNo - 1))
      .limit(pageSize)
      .populate(populate)
      .select(select)
  }

  const count = await database.find(filter).count()
  const totalPage = Math.ceil(count / pageSize)

  const data = {
    results: curPage,
    pagination: {
      count,
      pageNo,
      pageSize,
      hasPre: pageNo > 1,
      hasNext: pageNo < totalPage,
      totalPage
    }
  }

  // 當前無資料
  if (!count && pageNo === 1) {
    return data
  } else if (pageNo < 1 || pageNo > totalPage) {
    // 超過頁數
    return next(
      globalError({
        httpStatus: 404,
        errMessage: '無此分頁'
      })
    )
  }

  return data
}

export default pagination
