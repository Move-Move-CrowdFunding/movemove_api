import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import Notification from '../models/Notification'

function connectSocketIO(server: any, app: any) {
  const io = new Server(server)
  // 初始化 server

  io.on('connection', (socket) => {
    app.io = socket
    socket.on('getUnRead', async () => await getUnRead(socket))
  })
}

async function getUnRead(socket: any, approveUserId = '') {
  const cookie = socket.handshake?.headers.cookie
  const token = getCookieVal('userToken', cookie)
  if (!token) {
    return socket.emit('error', {
      status: 'error',
      msg: '尚未登入'
    })
  }

  const decoded: any = jwt.verify(token, (process.env as any).JWT_SECRET_KEY)
  try {
    const unReadCount = await Notification.find({
      userId: decoded.id,
      isRead: false
    }).countDocuments()

    socket.emit('unRead', {
      status: 'success',
      message: '取得未讀通知成功',
      results: {
        count: unReadCount,
        isChange: String(approveUserId) === String(decoded.id)
      }
    })
  } catch (error) {
    return socket.emit('error', {
      status: 'error',
      msg: '伺服器錯誤'
    })
  }
}

function getCookieVal(cookieKey: string, cookie: string) {
  const params = cookie.split(';').find((i: string) => i.includes(`${cookieKey}=`))
  return String(params).replace(`${cookieKey}=`, '').trim()
}

export default {
  connectSocketIO,
  getUnRead
}
