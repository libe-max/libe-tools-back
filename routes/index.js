const express = require('express')
const path = require('path')
const router = express.Router()

/* GET React app. */
const clientRoutes = ['/', '/edit/:type/:id', '/components' ]

router.get(clientRoutes, (req, res, next) => {
  res.sendFile(
    path.join(__dirname, '../client/index.html')
  )
})

router.get('*', (req, res, next) => {
  res.sendFile(
    path.join(__dirname, '../client/', req.url)
  )
})

module.exports = router
