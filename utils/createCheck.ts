import { NextFunction } from 'express'

import globalError from '../service/globalError'

import Check from '../models/Check'
import Project from '../models/Project'
import { Types } from 'mongoose'

const createCheck = async ({
  projectId,
  content,
  status,
  next
}: {
  projectId: Types.ObjectId
  content: string
  status: number
  next: NextFunction
}) => {
  if (![0, 1, -1].includes(status)) {
    return next(globalError({ errMessage: '審核狀態碼錯誤' }))
  }

  const project = await Project.findById(projectId)
  if (!project) {
    return next(globalError({ httpStatus: 404, errMessage: '查無此提案' }))
  }
  return await Check.create({
    projectId,
    content,
    status
  })
}

export default createCheck
