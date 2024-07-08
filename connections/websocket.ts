import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import Notification from '../models/Notification'

function connectSocketIO(server: any, app: any) {
  const io = new Server(server)
  // 初始化 server

  io.on('connection', (socket) => {
    app.io = socket
    app.server = io
    socket.on('getUnRead', async () => await getUnRead(socket, io))
  })
}

async function getUnRead(socket: any, io: any, approveUserId = '') {
  const cookie = socket?.handshake?.headers.cookie
  const token = getCookieVal('userToken', cookie)
  if (!token) {
    return socket.to(socket.id).emit('error', {
      status: 'error',
      msg: '尚未登入'
    })
  }

  const decoded: any = jwt.verify(token.trim(), (process.env as any).JWT_SECRET_KEY)
  const userId = approveUserId || decoded.id

  socket.join(userId)
  try {
    const unReadCount = await Notification.find({
      userId,
      isRead: false
    }).countDocuments()
    io.to(userId).emit('unRead', {
      status: 'success',
      message: '取得未讀通知成功',
      results: {
        count: unReadCount,
        isChange: !!approveUserId
      }
    })
  } catch (error) {
    return io.to(userId).emit('error', {
      status: 'error',
      msg: '伺服器錯誤'
    })
  }
}

function getCookieVal(cookieKey: string, cookie: string) {
  const params = String(cookie)
    .split(';')
    .find((i: string) => i.includes(`${cookieKey}=`))
  return String(params).replace(`${cookieKey}=`, '').trim()
}

export default {
  connectSocketIO,
  getUnRead
}
