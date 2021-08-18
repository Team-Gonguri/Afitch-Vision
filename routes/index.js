var express = require('express');
var router = express.Router();
const vision = require("../services/visionService")

/* Get Vector */
router.get('/vector', async (req, res, next) => {
  const url = req.query.url
  const output = await vision.getVector(url)
  return res.json(output)
});

/*Get Similarity*/
router.post('/similarity',async (req,res,next) =>{
    const trainer = req.body.data
    const user = req.query.url
    const output = await vision.getSimilarity(trainer,user)
    return res.json(output)
})


module.exports = router;
