const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/error', (req, res,next) => {
   
    const err = new Error("loi")
    err.status =401
    next(err)
  });
module.exports = router;
