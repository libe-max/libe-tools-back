const cheerio = require('cheerio')
const webshot = require('webshot')
const Zipper = require('node-zip')
const rimraf = require('rimraf')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
const config = require('../../.config')
const { getBundleCurrentSettings } = require('../../utils/bundles')

module.exports = async bundleData => {
  // Define a process id, and create a destination folder
  // in the temp directory of the server
  const processId = `${uuid()}`
  const outputDir = `temp/${processId}`
  const absoluteTempDir = path.join(config.server_root_path, 'temp')
  const absoluteOutputDir = path.join(config.server_root_path, outputDir)
  const publicOutputDir = `${config.server_public_root_url}/${outputDir}`
  if (!fs.existsSync(absoluteTempDir)) fs.mkdirSync(absoluteTempDir)
  fs.mkdirSync(absoluteOutputDir)

  // Gather template files in variables in order to copy
  // them in the destination folder
  const templateHtml = fs.readFileSync(path.join(__dirname, `/template/index.html`))
  const templateCss = fs.readFileSync(path.join(__dirname, `/template/style.css`))
  const templateAssetsDir = fs.readdirSync(
    path.join(__dirname, `/template/assets`)
  ).map(fileName => ({
    name: fileName,
    data: fs.createReadStream(
      path.join(
        __dirname,
        `/template/assets/${fileName}`
      )
    )
  }))

  // Gather story settings, then, for each slide of the
  // story, fill the template and make a screenshot
  const bundleSettings = getBundleCurrentSettings(bundleData)
  const bundleSlides = bundleSettings.slides
  const processingSlides = bundleSlides.map(async (slideData, i) => {
    // Shortcuts of useful spots in template
    const $ = cheerio.load(templateHtml)
    const $slide = $('.libe-insta-slide')
    const $titles = $('[data-property="title"]')
    const $texts = $('[data-property="text"]')
    const $images = $('[data-property="image"]')
    const $backgroundImages = $('*[data-property="background-images"]')
    const $coverDisplayBlock = $('.libe-insta-slide__cover-display')
    const $textOnBgImgDisplayBlock = $('.libe-insta-slide__text-on-bg-image-display')

    // Slide data
    const { display, title, text, image, backgroundImages, contentPosition, logo } = slideData

    // Assign display type class modifier
    $slide.addClass(`libe-insta-slide_${display}-display`)
    // Position the content
    const coverContentPosStyle = (() => {
      if (typeof parseInt(contentPosition, 10) !== 'number') return {}
      return {
        top: `${contentPosition / 100 * (1770 - 150) + 150}px`,
        transform: `translate(-50%, -${contentPosition}%)`
      }
    })()
    const nonCoverContentPosStyle = (() => {
      if (typeof parseInt(contentPosition, 10) !== 'number') return {}
      return {
        top: `${contentPosition / 100 * (1600 - 150) + 150}px`,
        transform: `translate(-50%, -${contentPosition}%)`
      }
    })()
    $coverDisplayBlock.css({
      top: coverContentPosStyle.top,
      transform: coverContentPosStyle.transform,
      '-webkit-transform': coverContentPosStyle.transform
    })
    $textOnBgImgDisplayBlock.css({
      top: nonCoverContentPosStyle.top,
      transform: nonCoverContentPosStyle.transform,
      '-webkit-transform': nonCoverContentPosStyle.transform
    })
    // If necessary, assign hidden title class modifier
    if (title && title.hidden) $slide.addClass(`libe-insta-slide_hidden-title`)
    // If necessary, assign hidden logo class modifier
    if (logo && logo.hidden) $slide.addClass(`libe-insta-slide_hidden-logo`)
    // Inject the title with the processed BR tags
    const titleValue = title ? (title.value || '') : ''
    const brSplitTitleValue = titleValue.split(/<br\s?\/?>/i)
    $titles.html('')
    brSplitTitleValue.forEach((line, i) => {
      $titles.append(line)
      if (i < brSplitTitleValue.length - 1) $titles.append('<br />')
    })
    // Inject the text with the processed BR tags
    const textValue = text ? (text.value || '') : ''
    const brSplitTextValue = textValue.split(/<br\s?\/?>/i)
    $texts.html('')
    brSplitTextValue.forEach((line, i) => {
      $texts.append(line)
      if (i < brSplitTextValue.length - 1) $texts.append('<br />')
    })
    // Inject the image
    if (image) $images.html(`<img src="${image.src}" alt="Slide illustration" />`)
    // Inject the background images
    if (backgroundImages) {
      $backgroundImages.html(backgroundImages.map(bgImg => {
        const node = cheerio.load('<div></div>')
        node('div').addClass('libe-insta-slide__background-image')
        node('div').css({
          'background-image': `url('${bgImg.src}')`,
          'background-size': `${bgImg.zoom || 1080}px`,
          'background-position': `
            ${bgImg.position.x ? 100 - bgImg.position.x : 50}%
            ${bgImg.position.y || 50}%`
        })
        return node('body').html()
      }).join(''))
    }

    // Copy the template folder in the output directory,
    // paste the filled template instead of the default one
    const outputTemplateDir = `${outputDir}/${i}`
    const outputTemplateHtml = `${outputTemplateDir}/index.html`
    const outputTemplateCss = `${outputTemplateDir}/style.css`
    const outputTemplateAssetsDir = `${outputTemplateDir}/assets`
    fs.mkdirSync(path.join(config.server_root_path, outputTemplateDir))
    fs.writeFileSync(path.join(config.server_root_path, outputTemplateHtml), $.html())
    fs.writeFileSync(path.join(config.server_root_path, outputTemplateCss), templateCss)
    fs.mkdirSync(path.join(config.server_root_path, outputTemplateAssetsDir))
    await Promise.all(
      templateAssetsDir.map(file => new Promise((resolve, reject) => {
        const outputFileDest = `${outputTemplateAssetsDir}/${file.name}`
        const outputFile = fs.createWriteStream(
          path.join(config.server_root_path, outputFileDest)
        )
        outputFile.on('close', () => resolve())
        outputFile.on('error', e => reject(e))
        file.data.pipe(outputFile)
      }))
    )

    // The filled templates are now in the temp directory
    // of the server, thus, accessible via HTTP. Even
    // though Webshot seems to be able to manipulate DOM
    // strings and/or files via the option `siteType`, the
    // result was not including the images called with a
    // relative URL when using those modes.
    // Making this server call itself via HTTP seems a bit
    // overkill but it works.

    // Preparing the Webshot options
    const input = `${config.server_local_root_url}/${outputTemplateHtml}`
    const output = path.join(
      config.server_root_path,
      `${outputDir}/${i}.jpg`
    )
    const options = {
      siteType: 'url',
      windowSize: { width: 1080, height: 1920 },
      shotSize: { width: 1080, height: 1920 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
    }

    // Promise wrapper around Webshot
    const webshotPromise = (dom, out, opt) => new Promise((resolve, reject) => {
      webshot(dom, out, opt, e => !e
        ? resolve(out)
        : reject(e)
      )
    })

    // Produce the image
    return webshotPromise(
      input,
      output,
      options
    )
  })

  const screenshots = await Promise.all(processingSlides)

  // Zip the images
  const zip = new Zipper()
  screenshots.map((screenshotPath, i) => zip.file(
    `${i}.jpg`, fs.readFileSync(screenshotPath)
  ))
  const zipped = zip.generate({
    base64: false,
    compression: 'DEFLATE'
  })
  const zipName = `story.zip`
  const absoluteZipPath = path.join(absoluteOutputDir, zipName)
  fs.writeFileSync(
    absoluteZipPath,
    zipped,
    'binary'
  )

  // Remove the temp folder 10 seconds after returning it
  setTimeout(() => {
    rimraf(absoluteOutputDir, () => {})
  }, 10000)

  const publicZipPath = `${publicOutputDir}/${zipName}`
  return publicZipPath
}
