import Notification from '../models/Notification'
import { NextFunction } from 'express'

import globalError from '../service/globalError'

const autoNotification = async ({
  userId,
  projectId,
  content,
  next
}: {
  userId: string
  projectId: string
  content: string
  next: NextFunction
}) => {
  if (!content.trim()) {
    return next(globalError({ errMessage: '請輸入通知內容' }))
  }
  await Notification.create({
    userId,
    projectId,
    content: content.trim()
  })
}

export default autoNotification
