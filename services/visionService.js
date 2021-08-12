const tf = require('@tensorflow/tfjs-node');
const posnet = require('@tensorflow-models/posenet');
const {createCanvas,Image} = require('canvas');
const path = require("path");

const imageScaleFactor = 0.5;
const outputStride = 16;
const flipHorizontal = false;
exports.tryModel = async(imgList) => {    
    let output=[]
    
    const net = await posnet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: 513,
        multiplier: 0.75});
    const canvas = createCanvas(500,500)
    const ctx = canvas.getContext('2d')    

    for await(const imgName of imgList){
        const indexOutput={}
        const img = new Image();
        img.onload = () => ctx.drawImage(img,0,0);
        img.src = path.join(__dirname,`../images/${imgName}`)
        const input = tf.browser.fromPixels(canvas)
        const pose = await net.estimateSinglePose(input,imageScaleFactor,flipHorizontal,outputStride)
        pose.keypoints.filter((keypoint,idx) => idx >= 5).forEach(keypoint => indexOutput[`${keypoint.part}`] ={x:keypoint.position.x,y:keypoint.position.y})
        output.push(indexOutput);
        for await (const keypoint of pose.keypoints) 
            indexOutput[`${keypoint.part}`] ={x:keypoint.position.x,y:keypoint.position.y}
    }
    return output
}