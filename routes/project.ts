import express, { Request, Response, NextFunction } from 'express'

// import Project from '../models/Project'
import catchAll from '../service/catchAll'
import requiredRules from '../utils/requiredRules'
import globalError from '../service/globalError'
const router = express.Router()

router.post(
  '/',
  catchAll(async (req: Request, res: Response, next: NextFunction) => {
    // const {
    //   introduce = '',
    //   teamName = '',
    //   title = '',
    //   email = '',
    //   categoryKey = 0,
    //   phone = '',
    //   targetMoney = 0,
    //   content = '',
    //   coverUrl = '',
    //   describe = '',
    //   videoUrl = '',
    //   startDate,
    //   endDate,
    //   relatedUrl = '',
    //   feedbackItem = '',
    //   feedbackUrl = '',
    //   feedbackMoney = 0,
    //   feedbackDate
    // } = req.body

    const requiredError: string[] = requiredRules({
      req,
      params: [
        'teamName',
        'email',
        'phone',
        'title',
        'categoryKey',
        'targetMoney',
        'startDate',
        'endDate',
        'describe',
        'coverUrl',
        'content'
      ],
      messageArea: 'project'
    })
    if (requiredError.length) {
      return next(
        globalError({
          errMessage: requiredError[0]
        })
      )
    }

    // const data = await Project.create({
    //   userId: '',
    //   introduce,
    //   teamName,
    //   title,
    //   email,
    //   categoryKey,
    //   phone,
    //   targetMoney,
    //   content,
    //   coverUrl,
    //   describe,
    //   videoUrl,
    //   startDate,
    //   endDate,
    //   relatedUrl,
    //   feedbackItem,
    //   feedbackUrl,
    //   feedbackMoney,
    //   feedbackDate
    // })
    // console.log(data)
  })
)

export default router
