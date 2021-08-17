const tf = require('@tensorflow/tfjs-node');
const posnet = require('@tensorflow-models/posenet');
const {createCanvas,Image} = require('canvas');
const path = require("path");
const {cutFrames,getImages,deleteImages} = require("../services/imageService")
const { poseSimilarity} = require('posenet-similarity')

const imageScaleFactor = 0.5;
const outputStride = 16;
const flipHorizontal = false;
const uuid = require("../services/uuidUtil")

exports.getSimilarity = async(trainer, user) =>{
    const trainerOutput = await this.getVector(trainer)
    const userOutput = await this.getVector(user)
    let sum=0,length = trainerOutput.length > userOutput.length? userOutput.length:trainerOutput.length
    
    for (i=0;i<length;i++){
        const output = poseSimilarity(trainerOutput[i],userOutput[i],{
            mode:'multiply',
            scores:{leftEye:0,
                    nose:0,
                    rightEye:0,
                    leftEar:0,
                    rightEar:0
    
            }
        })
        console.log(output)
        sum += output
    }
    return sum/length
}

exports.getVector = async(url) => {    
    const output = []
    /*
     * 요청 식별을 위한 identifier
     */
    const identifier = await uuid.uuidv4()
    
    /*
     * 초 단위로 동영상 img로 자름
     */
    await cutFrames(url,identifier)
    
    /*
     * input으로 넣을 imgList
     */
    const fileList = await getImages(identifier)

    const net = await posnet.load({
        architecture: 'ResNet50',
        outputStride: 32,
        inputResolution: { width: 257, height: 200 },
        quantBytes: 2});
    const canvas = createCanvas(500,500)
    const ctx = canvas.getContext('2d')    

    for await(const fileName of fileList){
        const img = new Image();
        img.onload = () => ctx.drawImage(img,0,0);
        img.src = path.join(__dirname,`../images/${fileName}`)
        const input = tf.browser.fromPixels(canvas)
        const pose = await net.estimateSinglePose(input,imageScaleFactor,flipHorizontal,outputStride)
        output.push(pose)
    }
    await deleteImages(fileList)
    return output
}