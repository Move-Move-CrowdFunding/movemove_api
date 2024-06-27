import Notification from '../models/Notification'
import { NextFunction } from 'express'
import { Types } from 'mongoose'
import globalError from '../service/globalError'
import Project from '../models/Project'
import projectType from '../interface/project'
import WS from '../connections/websocket'

/**
 * @param {Types.ObjectId} userId 用戶 id
 * @param {Types.ObjectId} projectId 提案 id
 * @param {string} content 提案內容 - <projectName> 自動替換對應提案標題
 */
/**
 * 使用範例
    const notification = await autoNotification({
      userId,
      projectId: data._id,
      content: '你已發起「<projectName>」的提案',
      next
    })

    if (!notification._id) return
 */
const autoNotification = async ({
  req,
  userId,
  projectId,
  content,
  status,
  next
}: {
  req: any
  userId: Types.ObjectId
  projectId: Types.ObjectId
  content: string
  status: number
  next: NextFunction
}) => {
  if (!String(userId)) {
    return next(globalError({ errMessage: '尚未登入' }))
  }

  let finalContent = content

  if (Number(status) !== 1 && !content.trim()) {
    return next(globalError({ errMessage: '請輸入通知內容' }))
  }

  if (content.includes('<projectName>')) {
    const project: projectType | null = await Project.findById(projectId)
    if (!project) {
      return next(globalError({ httpStatus: 404, errMessage: '查無此提案' }))
    } else {
      finalContent = content.replace('<projectName>', project.title)
    }
  }

  const data = await Notification.create({
    userId,
    projectId,
    content: finalContent.trim()
  })
  WS.getUnRead(req.app.io, String(userId))
  return data
}

export default autoNotification
