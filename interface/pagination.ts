interface paginationOption {
  sort?: {
    [key: string]: any
  }
  filter?: {
    [key: string]: any
  }
  populate?: {
    [key: string]: any
  }
  select?: string
}

interface paginationReq extends Request {
  query: {
    pageSize: number
    pageNo: number
    [key: string]: any
  }
  [key: string]: any
}

interface paginationData {
  results: any[]
  pagination: {
    count: number
    pageNo: number
    pageSize: number
    hasPre: boolean
    hasNext: boolean
    totalPage: number
  }
}

export { paginationOption, paginationReq, paginationData }
