const express = require('express')
const router = express.Router()
const build = require('../bundle-builder/index')

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  GET ALL BUNDLES FROM DATABASE
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

router.all('/get-all-bundles', (req, res, next) => {
  const collection = req.db.collection('bundles')
  collection.find({}, (e, docs) => !e
    ? res.json({ err: null, data: docs })
    : res.json({ err: e, data: null })
  )
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  GET ONE BUNDLE BY IT'S ID
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

router.all('/get-bundle/:id', (req, res, next) => {
  const id = req.params.id
  const collection = req.db.collection('bundles')
  const idIsValid = id.match(/^[0-9a-fA-F]{24}$/)
  if (!idIsValid) {
    return res.json({
      err: `Requested bundle ID is not valid (${id})`,
      data: null
    })
  }
  collection.findOne({ _id: id }, (e, doc) => !e
    ? res.json({ err: null, data: doc })
    : res.json({ err: e, data: null })
  )
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  CREATE A NEW BUNDLE IN DATABASE
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

router.all('/create-bundle/:type', (req, res, next) => {
  const type = req.params.type
  const now = Date.now()
  const collection = req.db.collection('bundles')
  const newBundle = {
    type,
    settings_history: [],
    created_on: now
  }
  collection.insert(newBundle, (e, docs) => !e
    ? res.json({ err: null, data: docs })
    : res.json({ err: e, data: null })
  )
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  SAVE A BUNDLE EDITION
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

router.put('/save-bundle/:id', (req, res, next) => {
  const id = req.params.id
  const now = Date.now()
  const collection = req.db.collection('bundles')
  const idIsValid = id.match(/^[0-9a-fA-F]{24}$/)
  const request = { $push: {
    settings_history: {
      ...req.body,
      timestamp: now
    }
  } }
  if (!idIsValid) {
    return res.json({
      err: `Requested bundle ID is not valid (${id})`,
      data: null
    })
  }
  collection.findOneAndUpdate(
    { _id: id }, request, (e, doc) => !e
      ? res.json({ err: null, data: doc })
      : res.json({ err: e, data: null })
  )
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  DELETE A BUNDLE
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

router.delete('/delete-bundle/:id', (req, res, next) => {
  const id = req.params.id
  const collection = req.db.collection('bundles')
  const trash = req.db.collection('trash')
  const idIsValid = id.match(/^[0-9a-fA-F]{24}$/)
  if (!idIsValid) {
    return res.json({
      err: `Requested bundle ID is not valid (${id})`,
      data: null
    })
  }
  collection.findOneAndDelete({ _id: id }, (e, doc) => {
    if (!doc) {
      return res.json({
        err: `Found no doc with id: ${id}`,
        data: null
      })
    }
    if (e) return res.json({ err: e, data: null })
    const trashed = Object.assign({}, doc, {
      _original_id: doc._id
    })
    delete trashed._id
    trash.insert(trashed, (e, doc) => !e
      ? res.json({ err: null, data: id })
      : res.json({ err: e, data: null })
    )
  })
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  BUILD A BUNDLE
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

router.get('/build/:id', (req, res, next) => {
  const id = req.params.id
  const collection = req.db.collection('bundles')
  const idIsValid = id.match(/^[0-9a-fA-F]{24}$/)
  if (!idIsValid) {
    return res.json({
      err: `Requested bundle ID is not valid (${id})`,
      data: null
    })
  }
  collection.findOne({ _id: id }, async (e, doc) => {
    if (e) return res.json({ err: e, data: null })
    try {
      const builtPath = await build(doc)
      res.json({ err: null, data: builtPath })
    } catch (err) {
      res.json({ err: err, data: null })
    }
  })
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *  ALL OTHER REQUESTS
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

router.all('/*', (req, res, next) => res.json({
  data: null,
  err: `There is nothing to ${req.method} on ${req.url}`
}))

module.exports = router
