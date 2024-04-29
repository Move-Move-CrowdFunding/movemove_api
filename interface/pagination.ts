interface paginationOption {
  sort: Record<string, any>
  filter: Record<string, any>
}

interface paginationReq {
  body: {
    pageSize: number
    pageNo: number
  }
  [key: string]: any
}

export type { paginationOption, paginationReq }
