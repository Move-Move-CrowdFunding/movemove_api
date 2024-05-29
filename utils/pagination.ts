import type { paginationOption, paginationReq } from '../interface/pagination'
import globalError from '../service/globalError'
import { NextFunction } from 'express'

/**
 *
 * @param {*} database 單一資料庫名稱
 * @param {*} option 篩選/排序方法
 * @returns 返回篩選後結果 + 分頁
 * 具體使用可參考 GET - /project
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
  const { populate } = option

  const optionArr: any[] = []
  const addOptionArr = (object: any, objectName: string) => {
    if (Object.keys(object) && objectName) {
      const keyMap = new Map([
        ['filter', '$match'],
        ['sort', '$sort'],
        ['select', '$project'],
        ['lookup', '$lookup'],
        ['lookup1', '$lookup'],
        ['lookup2', '$lookup'],
        ['match', '$match'],
        ['set', '$set']
      ])
      if (keyMap.has(objectName)) {
        optionArr.push({
          [keyMap.get(objectName) as string]: object
        })
      }
    }
  }

  Object.keys(option).forEach((keyStr) => addOptionArr(option[keyStr], String(keyStr)))

  // 向下查找

  const curPage = await database
    .aggregate([
      ...optionArr,
      {
        $skip: pageSize * (pageNo - 1)
      },
      {
        $limit: pageSize
      }
    ])
    .exec()

  // 向上查找
  if (populate) {
    await database.populate(curPage, populate)
  }

  const totalData = await database.aggregate([...optionArr])

  const count = totalData.length
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
