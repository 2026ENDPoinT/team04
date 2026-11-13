const path = require('path');
const express = require('express');
const router = express.Router();
const predictionController = require(path.join(__dirname, '../controllers/prediction.controller'));
const { verifyToken } = require(path.join(__dirname, '../middlewares/auth.middleware'));

router.use(verifyToken);

router.get('/', predictionController.getPredictions);
router.post('/', predictionController.savePrediction);
router.delete('/:id', predictionController.deletePrediction);

module.exports = router;