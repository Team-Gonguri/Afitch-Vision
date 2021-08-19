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
    const output = await this.getVector(user)
    let sum1=0,sum2=0,length = trainer.length > output.length? trainer.length:output.length
    
    for (i=0;i<length;i++){
        const similarity = poseSimilarity(trainer[i],output[i],{
            mode:'multiply',
            scores:{leftEye:0,
                    nose:0,
                    rightEye:0,
                    leftEar:0,
                    rightEar:0
            }
        })
        const value = Math.log2(Math.pow(similarity+1,100))
        console.log(value)
        sum1 += value
        sum2 += similarity
    }
    console.log("not processed == "+(sum2/length))
    console.log("processed == "+(sum1/(length)))
    return sum1/length
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