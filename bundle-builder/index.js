const libeInstagramStory = require('./libe-instagram-story')

module.exports = async (bundleData) => {
  const { type } = bundleData
  switch (type) {
    case 'libe-instagram-story':
      return libeInstagramStory(bundleData)
    default:
      throw new Error({
        message: `Unable to build bundles of type ${type}`
      })
  }
}
