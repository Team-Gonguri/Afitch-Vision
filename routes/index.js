var express = require('express');
var router = express.Router();
const {cutFrames,getImages,deleteImages} = require("../services/imageService")
const uuid = require("../services/uuidUtil")
const vision = require("../services/visionService")

/* GET home page. */
router.get('/', async (req, res, next) => {
  /**
   * 요청 식별을 위한 identifier
   */
  const identifier = await uuid.uuidv4()
  /**
   * 초 단위로 동영상 img로 자름
   */
  await cutFrames(req.query.url,identifier)
  /**
   * input으로 넣을 imgList
   */
  const fileList = await getImages(identifier)
  /**
   * model 돌린 결과 값
   */
  const output = await vision.tryModel(fileList)
  /**
   * 만들어진 이미지 삭제
   */
  await deleteImages(fileList)
  
  return res.json(output)
});

module.exports = router;
