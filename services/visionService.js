const tf = require('@tensorflow/tfjs-node');
const posnet = require('@tensorflow-models/posenet');
const {createCanvas,Image} = require('canvas');
const path = require("path");
const { json } = require('express');

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

    const img = new Image();
    const canvas = createCanvas(500,500)
    const ctx = canvas.getContext('2d')    
    img.onload = () => ctx.drawImage(img,500,500);

    for await(imgName of imgList){
        img.src = path.join(__dirname,`../images/${imgName}`)
        const input = tf.browser.fromPixels(canvas)
        const pose = await net.estimateSinglePose(input,imageScaleFactor,flipHorizontal,outputStride)
        let indexOutput = {}
        for await (const keypoint of pose.keypoints) 
            indexOutput[`${keypoint.part}`] ={x:keypoint.position.x,y:keypoint.position.y}
        output.push(indexOutput);
    }
    return output
}