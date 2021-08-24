const tf = require('@tensorflow/tfjs-node');
const posnet = require('@tensorflow-models/posenet');
const {createCanvas,Image} = require('canvas');
const path = require("path");
const {cutFrames,getImages,deleteImages} = require("../services/imageService")
const { poseSimilarity} = require('posenet-similarity')
const uuid = require("../services/uuidUtil")

const  exclude = ["nose","leftEye","rightEye","leftEar","rightEar"]
const width = 640, height = 480

exports.getSimilarity = async(trainer, user) =>{
    const output = await this.getVector(user)
    let sum=0,length = trainer.length > output.length?output.length:trainer.length
    let sum2=0
    for (i=0;i<length;i++){
        const similarity = poseSimilarity(trainer[i],output[i],{strategy:'weightedDistance'})
        const value = Math.log2(Math.pow(similarity+1,1000))
                   
        sum += value
    }
    return 100-sum/(length*10)
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
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: width*2, height: height*2 },
        multiplier: 0.75});   

        const canvas = createCanvas(width,height)
        const ctx = canvas.getContext('2d')   

        for await(const fileName of fileList){
        const img = new Image();
        img.onload = () => ctx.drawImage(img,0,0);
        img.src = path.join(__dirname,`../images/${fileName}`)
        const input = tf.browser.fromPixels(canvas)
        const pose = await net.estimateSinglePose(input)
        pose.keypoints = pose.keypoints.filter(it => !exclude.includes(it.part))
        output.push(pose)
    }
    await deleteImages(fileList)
    return output
}