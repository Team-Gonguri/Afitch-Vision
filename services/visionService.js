const tf = require('@tensorflow/tfjs-node');
const posnet = require('@tensorflow-models/posenet');
const {createCanvas,Image} = require('canvas');
const path = require("path");
const {cutFrames,getImages,deleteImages} = require("../services/imageService")
const { poseSimilarity} = require('posenet-similarity')
const uuid = require("../services/uuidUtil")

const imageScaleFactor = 0.5;
const outputStride = 16;
const flipHorizontal = false;
const  exclude = ["nose","leftEye","rightEye","leftEar","rightEar"]

exports.getSimilarity = async(trainer, user) =>{
    const output = await this.getVector(user)
    let sum=0,length = trainer.length > output.length?output.length:trainer.length
    
    for (i=0;i<length;i++){
        const similarity = poseSimilarity(trainer[i],output[i],{strategy:"cosineSimilarity"})
        //const value = Math.log2(Math.pow(similarity+1,100))
        sum += similarity
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
        pose.keypoints = pose.keypoints.filter(it => !exclude.includes(it.part))
        output.push(pose)
    }
    await deleteImages(fileList)
    return output
}