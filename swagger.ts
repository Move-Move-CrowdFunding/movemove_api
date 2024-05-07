import swaggerAutogen from 'swagger-autogen'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const doc = {
  info: {
    title: 'MoveMove API',
    description:
      '<h3>MoveMove 募募 募資網站 API 列表</h3><li>您可以在此查看所有的 API 與線上測試</li><li>若有問題反饋可以到我們的<a href="https://github.com/Move-Move-CrowdFunding/movemove_api">Github</a>發issue</li>'
  },
  host: process.env.SWAGGER_HOST,
  schemes: [`${process.env.SWAGGER_SCHEMES}`],
  securityDefinitions: {
    token: {
      type: 'apiKey',
      in: 'headers',
      name: 'Authorization',
      description: '請填寫 token'
    }
  }
}

const outputFile = './swagger-output.json'
const routes = ['./app.ts']

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc)

/** Swagger 註解寫法
 * #swagger.tags = ['Projects - 提案']
 * #swagger.description = '發起提案'
 * #swagger.security = [{
    token: []
    }]
  * #swagger.parameters['body'] = {
    in: 'body',
    description: '發起提案格式',
    type: 'object',
    required: true,
    schema: {
      $userId: '66378c5f9fb5b5e7c300e95c',
      introduce: '團隊介紹',
      $teamName: '提案人姓名/團隊名稱',
      $title: '提案標題',
      $email: '聯絡信箱',
      $categoryKey: 1,
      $phone: '連絡電話',
      $targetMoney: 50000,
      $content: '<p>提案內容</p>',
      $coverUrl: 'https://fakeimg.pl/300/',
      $describe: '提案簡介',
      videoUrl: 'https://youtube.com/',
      $startDate: 1678982400,
      $endDate: 1679846400,
      relatedUrl: 'https://www.google.com/',
      feedbackItem: '限量精美小熊維尼',
      feedbackUrl: 'https://fakeimg.pl/300/',
      feedbackMoney: 100,
      feedbackDate: 1682524800
    }
    }
  * #swagger.responses[200] = {
    description: '發起提案成功',
    schema: {
      "status": "success",
      "message": "資料新增成功"
    },
    }
  * #swagger.responses[400] = {
    description: '發起提案失敗',
    schema: {
      "status": "error",
      "message": "請輸入提案標題"
    },
    }
  *
  */
