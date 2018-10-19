const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const monk = require('monk')

const indexRouter = require('./routes/index')
const apiRouter = require('./routes/api')
const tempRouter = require('./routes/temp')

const app = express()

// View engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'client/build')))

// Simulate latency
// app.use((req, res, next) => {
//   const delay = Math.floor(Math.random() * 800) + 200
//   const envIsDev = req.app.get('env') === 'development'
//   if (envIsDev) setTimeout(next, delay)
//   else next()
// })

// Database
const db = monk('localhost:27017/libetools')
app.use((req, res, next) => {
  req.db = db
  next()
})

// Routes
app.use('/api', apiRouter)
app.use('/temp', tempRouter)
app.use('/', indexRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
