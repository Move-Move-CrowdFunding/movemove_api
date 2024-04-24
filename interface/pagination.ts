interface paginationOption {
  sort: {
    [key:string]: any
  },
  filter: {
    [key:string]: any
  },
}

interface paginationReq {
  body: {
    pageSize: number
    pageNo: number
  },
  [key:string]: any
}

export {
  paginationOption,
  paginationReq
}