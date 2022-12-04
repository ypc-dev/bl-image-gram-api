// {bucketname}/{username}/{postId}/original/filename
// {bucketname}/{username}/{postId}/resized/filename

const AWS = require("aws-sdk")
const parseMultipart = require("parse-multipart")
const Jimp = require('jimp');
const path = require('path')

const BUCKET = process.env.BUCKET
const s3 = new AWS.S3()

const main = async (event) => {
    try {
        const { filename, data } = extractFile(event)

        if (!acceptedFormat(filename)) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    message: "Allowed image formats: .png, .jpg, .jpeg, .bmp"
                })
            }
        }

        let resizedImageData
        const imageToResize = await Jimp.read(data)
        imageToResize.resize(200, 200)
        imageToResize.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
            resizedImageData = buffer
        }) // works

        // Put original and resized images into their own folder in S3 bucket
        await s3.putObject({
            Bucket: BUCKET, Key: `original/${filename}`, ACL: "public-read", Body: data
        }).promise()
        await s3.putObject({
            Bucket: BUCKET, Key: `resized/${filename}`, ACL: "public-read", Body: resizedImageData
        }).promise()

        return {
            statusCode: 200,
            body: JSON.stringify({
                originalImageLink: `https://${BUCKET}.s3.amazonaws.com/original/${filename}`,
                resizedImageLink: `https://${BUCKET}.s3.amazonaws.com/resized/${filename}`
            })
        }
    } catch (error) {
        console.error(error)

        return {
            statusCode: error.statusCode,
            body: JSON.stringify({
                message: `Error: ${error.message}`,
                exceptionCode: `${error.code}`
            })
        }
    }
}

const extractFile = (event) => {
    const boundary = parseMultipart.getBoundary(event.headers["Content-Type"])
    const bodyBuffer = Buffer.from(event.body, "base64")
    const parts = parseMultipart.Parse(bodyBuffer, boundary)
    const [{ filename, data }] = parts

    return {
        filename,
        data
    }
}

const acceptedFormat = (filename) => {
    const acceptedFormats = [".jpg", ".jpeg", ".png", ".bmp"]

    return acceptedFormats.includes(path.extname(filename))
}

module.exports = {
    main
}

