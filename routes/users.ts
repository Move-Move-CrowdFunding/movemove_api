import express from 'express'
const router = express.Router()

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource')
  const a = 'b'
  if (a === 'b') {
    console.log('a')
  }
})

export default router
