import express from 'express'
// import catchAll from '../service/catchAll'
// import { getPayload } from '../utils/genFakeProject'

import projectType from '../interface/project'
import Project from '../models/Project'
import Sponsor from '../models/Sponsor'
import Track from '../models/Track'
import parseToken from '../middleware/parseToken'
import moment from 'moment'

interface IndexHome extends projectType {
  // existing properties...
  _id: string
  achievedMoney: number
  percentage: number
  trackingStatus?: boolean
}

const router = express.Router()

/* GET home page. */
// TODO: 之後還要補上是否已經審核通過的條件
router.get('/info', parseToken, async function (req, res) {
  /**
     * #swagger.tags = ['Home']
     * #swagger.description = '取得首頁資料'
     * #swagger.security = [{
        token: []
       }]
     * #swagger.responses[200] = {
        description: '取得首頁資料成功，有登入才會回傳trackingStatus這個key',
        schema: {
          "status": "success",
          "message": "取得首頁資料成功",
          "results": {
            "hotProjects": [{
              "_id": "663a5750e34b6703e22a9f60",
              "introduce": "專業金援團隊，弱勢族群救星，幫助許多需要協助的家庭。",
              "teamName": "弱勢救星",
              "email": "nomail@mail.com",
              "phone": "0938938438",
              "title": "第二筆提案",
              "categoryKey": 2,
              "targetMoney": 50000,
              "startDate": 1718121600,
              "endDate": 1718985600,
              "describe": "一場無情的大火吞噬了整個社區，請幫助無家可歸的民眾。",
              "coverUrl": "https://fakeimg.pl/300/",
              "content": "<p>test</p>",
              "videoUrl": "",
              "relatedUrl": "",
              "feedbackItem": "限量精美小熊維尼",
              "feedbackUrl": "https://fakeimg.pl/300/",
              "feedbackMoney": 100,
              "feedbackDate": 1682524800,
              "achievedMoney": 0,
              "trackingStatus": false,
              "percentage": 50
            }],
            "recommendProjects": [],
            "successProjects": [],
            "achievements": {
              "projectTotal": 0,
              "amountTotal": 0,
              "peopleTotal": 0
            }
          }
        },
       }
     *
     */

  const sponsorsTotal = await Sponsor.aggregate([
    {
      $group: {
        _id: '$projectId',
        achievedMoney: { $sum: '$money' }
      }
    },
    {
      $project: {
        projectId: '$_id',
        achievedMoney: 1,
        _id: 0
      }
    }
  ])

  const now = moment().unix()
  const allProjects = await Project.find()

  const computedProject: IndexHome[] = allProjects.map((project) => {
    const sponsor = sponsorsTotal.find((sponsor) => sponsor.projectId === project.id)
    let percentage = 0
    if ((project.targetMoney ?? 0) > 0) {
      percentage = ((sponsor?.achievedMoney || 0) / (project.targetMoney ?? 0)) * 100
    }
    return {
      ...project.toObject(),
      achievedMoney: sponsor?.achievedMoney || 0,
      percentage
    }
  })

  const nowProjects = computedProject.filter(
    (project) => project.startDate ?? (now > 0 && (project.endDate ?? 0) > now)
  )

  const hotProjects = nowProjects.sort((a, b) => b.percentage - a.percentage).slice(0, 10)
  const recommendProjects = nowProjects.sort((a, b) => b.startDate - a.startDate).slice(0, 6)

  const successProjects = getRandomSubarray(
    computedProject.filter((project) => project.achievedMoney >= project.targetMoney),
    4
  )

  const projectTotal = allProjects.length
  const amountTotal = sponsorsTotal.reduce((total, project) => total + project.achievedMoney, 0)
  const peopleTotal = await Sponsor.distinct('userId')

  const { isLogin, payload } = req as any
  if (isLogin && payload.id) {
    // 把 hotProjects recommendProjects successProjects 合併成一個陣列 (去除重複的projectId)
    const combinedProjects = hotProjects.concat(recommendProjects, successProjects, recommendProjects)

    const uniqueProjects = combinedProjects.filter(
      (project, index, self) => index === self.findIndex((t) => t._id === project._id)
    )

    const tracks = await Track.find(
      {
        userId: payload.id,
        projectId: { $in: uniqueProjects.map((project) => project._id) }
      },
      { projectId: 1 }
    )
    hotProjects.forEach((project, index, array) => {
      array[index].trackingStatus = !!tracks.find((track) => track.projectId?.toString() === project._id.toString())
    })
    recommendProjects.forEach((project, index, array) => {
      array[index].trackingStatus = !!tracks.find((track) => track.projectId?.toString() === project._id.toString())
    })
    successProjects.forEach((project, index, array) => {
      array[index].trackingStatus = !!tracks.find((track) => track.projectId?.toString() === project._id.toString())
    })
  }

  const returnData = {
    hotProjects,
    recommendProjects,
    successProjects,
    achievements: {
      projectTotal,
      amountTotal,
      peopleTotal: peopleTotal.length
    }
  }

  res.status(200).json(returnData)
})

function getRandomSubarray<T>(arr: Array<T>, size: number) {
  const shuffled = arr.slice(0)
  let i = arr.length
  while (i--) {
    const index = Math.floor((i + 1) * Math.random())
    const temp = shuffled[index]
    shuffled[index] = shuffled[i]
    shuffled[i] = temp
  }
  return shuffled.slice(0, size)
}

export default router
