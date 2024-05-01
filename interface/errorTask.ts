interface errorTask extends Error {
  httpStatus?: number // HTTP 狀態碼
  isOperational?: boolean // 是否為預期錯誤
  message: string
  errors?: any
}

export default errorTask
