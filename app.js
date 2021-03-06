const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const monk = require('monk')
const config = require('./.config')

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

// Allow requests from all sources
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// Database
const db = monk(config.env === 'PROD'
  ? config.db_public_url
  : config.db_local_url
)
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
