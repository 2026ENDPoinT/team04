const path = require('path');
const express = require('express');
const router = express.Router();
const courseController = require(path.join(__dirname, '../controllers/course.controller'));
const { verifyToken } = require(path.join(__dirname, '../middlewares/auth.middleware'));
const { validateCourseInput } = require(path.join(__dirname, '../middlewares/course.validator'));

router.use(verifyToken);

router.get('/', courseController.getCourses);
router.post('/', validateCourseInput, courseController.createCourse);
router.put('/:id', validateCourseInput, courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

module.exports = router;