import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import Notification from '../models/Notification'

function connectSocketIO(server: any) {
  // 初始化 server
  const io = new Server(server)

  io.on('connection', (socket) => {
    const token = socket.handshake.auth.token

    if (!token) {
      return socket.emit('error', {
        status: 'error',
        msg: '尚未登入'
      })
    }

    socket.on('getNotify', async (data: any) => {
      const { pageNo = 1, pageSize = 10 } = data
      try {
        const decoded: any = jwt.verify(token, (process.env as any).JWT_SECRET_KEY)
        if (decoded) {
          const option: any = [
            {
              $match: {
                userId: new Types.ObjectId(decoded.id)
              }
            },
            {
              $sort: {
                createTime: -1
              }
            },
            {
              $set: {
                isRead: true
              }
            }
          ]
          const curPage = await Notification.aggregate([
            ...option,
            {
              $skip: pageSize * (pageNo - 1)
            },
            {
              $limit: pageSize
            }
          ])
          await Notification.populate(curPage, {
            path: 'projectId'
          })

          const totalData = await Notification.aggregate([...option])
          const count = totalData.length
          const totalPage = Math.ceil(count / pageSize)
          const data = {
            results: curPage,
            pagination: {
              count,
              pageNo,
              pageSize,
              hasPre: pageNo > 1,
              hasNext: pageNo < totalPage,
              totalPage
            }
          }

          if (pageNo < 1 || pageNo > totalPage) {
            return socket.emit('error', {
              status: 'error',
              message: '無此分頁'
            })
          }
          if (!data) {
            return socket.emit('error', {
              status: 'error',
              msg: '資料讀取錯誤'
            })
          }

          await Notification.updateMany(
            { _id: { $in: data.results.map((item) => item._id) } },
            { $set: { isRead: true } }
          )

          await getUnRead(socket)

          const results = data.results.map((item: any) => ({
            id: item._id,
            content: item.content,
            isRead: item.isRead,
            createTime: item.createTime,
            project: {
              id: item.projectId.id,
              title: item.projectId.title,
              coverUrl: item.projectId.coverUrl
            }
          }))

          socket.emit('notify', {
            status: 'success',
            message: '取得最新通知成功',
            ...data,
            results
          })
        }
      } catch (err) {
        await getUnRead(socket)

        return socket.emit('error', {
          status: 'error',
          msg: '伺服器錯誤'
        })
      }
    })

    socket.on('getUnRead', async () => await getUnRead(socket))
  })
}

async function getUnRead(socket: any) {
  const token = socket.handshake.auth.token

  if (!token) {
    return socket.emit('error', {
      status: 'error',
      msg: '尚未登入'
    })
  }

  try {
    const decoded: any = jwt.verify(token, (process.env as any).JWT_SECRET_KEY)
    const unReadCount = await Notification.find({
      userId: decoded.id,
      isRead: false
    }).countDocuments()

    socket.emit('unRead', {
      status: 'success',
      message: '取得未讀通知成功',
      results: {
        count: unReadCount
      }
    })
  } catch (error) {
    return socket.emit('error', {
      status: 'error',
      msg: '伺服器錯誤'
    })
  }
}

export default connectSocketIO
