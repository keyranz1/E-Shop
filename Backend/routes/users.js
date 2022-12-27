const express = require('express');
const { User } = require('../models/user');
const router = express.Router();
const bcrypt = require('bcrypt');

router.get(`/`, async (req, res) => {
    const userList = await User.find().select('-passwordHash');

    if(!userList){
        res.status(500).json({success: false});
    }
    res.send(userList);
})

router.get(`/:id`, async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if(!user){
        res.status(500).json({success: false, message: 'The user with the given ID was not found.'});
    }
    res.status(200).send(user);
})

router.post(`/`, async(req, res) => {
    // var saltSync = bcrypt.genSaltSync(10);
    let user = new User({
        name : req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        street: req.body.street,
        apartment: req.body.apartment,
        city : req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin
    })

    console.log(user);
    user = await user.save();
    console.log(user);
    if(!user)
    {
        return res.status(404).send('The User cannot be created/registered.');
    }

    res.send(user);
})

router.put(`/:id`, async (req, res) => {

    var userExist = await User.findById(req.params.id);
    if(!userExist)
        return res.status(400).send('User doesnot exist');

    let newPassword;
    if(req.body.password)
        newPassword = bcrypt.hashSync(req.body.password, 10);
    else
        newPassword = userExist.passwordHash;
    
    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name : req.body.name,
            email: req.body.email,
            passwordHash: newPassword,
            street: req.body.street,
            apartment: req.body.apartment,
            city : req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            isAdmin: req.body.isAdmin
        },
        // default returns old data but for new specify for to send to response
        { new : true }
    )

    if(!user)
        return res.status(404).send('The Category could not be updated.');

    res.send(user);
})

module.exports = router;