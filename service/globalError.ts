import type errorTask from '../interface/errorTask'

/**
 *
 * @param {number} httpStatus HTTP 狀態碼, 默認 400
 * @param {string} errMessage 自訂錯誤訊息
 * @returns {errorTask} new Error
 */

const globalError = ({ httpStatus = 400, errMessage }: { httpStatus?: number; errMessage: string }) => {
  const error: errorTask = new Error(errMessage)
  error.httpStatus = httpStatus
  error.isOperational = true
  return error
}

export default globalError
