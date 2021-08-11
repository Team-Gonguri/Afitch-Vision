const extractFrames = require('ffmpeg-extract-frames')
const path = require('path')
const fs = require('fs')

exports.cutFrames = async(url,identifier) => {
await extractFrames({
        input: url,
        output: path.join(__dirname,`../images/${identifier}-%d.png`),
        fps: 1
    })
}

exports.getImages = async(identifier) =>{
    return fs.readdirSync(path.join(__dirname,"../images")).filter(file => file.startsWith(identifier)).sort((a,b) => {
        return a.substring(a.lastIndexOf("-")+1,a.lastIndexOf(".")) - b.substring(b.lastIndexOf("-")+1,b.lastIndexOf("."))
    })
}

exports.deleteImages = async (fileList) => {
    for (file of fileList)
        fs.rmSync(path.join(__dirname,`../images/${file}`))
}
