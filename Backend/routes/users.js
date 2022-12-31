const express = require('express');
const { User } = require('../models/user');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

router.get(`/get/count`, async (req, res) => {
    //const product = await Product.findById(req.params.id).populate('category');
    const userCount = await User.countDocuments();

    if(!userCount){
        res.status(500).json({success: false});
    }
    res.send({
        count: userCount
    });
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
    
    user = await user.save();
    
    if(!user)
    {
        return res.status(404).send('The User cannot be created/registered.');
    }

    res.send(user);
})

router.post(`/register`, async(req, res) => {
    
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
    
    user = await user.save();
    
    if(!user)
    {
        return res.status(404).send('The User cannot be registered.');
    }

    res.send(user);
})

router.post(`/login`, async(req, res) => {
    const user = await User.findOne({email: req.body.email});
    const secret =  process.env.secret;
    
    if(!user)
    {
        return res.status(404).send('The User not found for given email.');
    }

    if(user && bcrypt.compareSync(req.body.password, user.passwordHash)){
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            {
                expiresIn: '1d'
            }
        );

        return res.status(200).send({user: user.email, token: token});
    }
    else
    {
        res.status(404).send('The password entered is wrong for the following email.');
    }

    // res.send(user);
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

router.delete(`/:id`, (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user => {
        if(user){
            return res.status(200).json({ success: true, message: 'The user was deleted.'});
        }
        else{
            return res.status(404).json({ success: false, message: 'User not found.'});
        }
    }).catch( err => {
        return res.status(400).json({ success: false, error: err, message: 'Failed to delete the user.'});
    })
})

module.exports = router;