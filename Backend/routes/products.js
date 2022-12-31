const express = require('express');
const { Category } = require('../models/category');
const { Product } = require('../models/product');
const router = express.Router();
const mongoose = require('mongoose');

router.get(`/`, async (req, res) => {
    // const productList = await Product.find().select('name image -_id');
    let filter = {};
    if(req.query.categories)
        filter = {category: req.query.categories.split(',')};
    const productList = await Product.find(filter).populate('category');

    if(!productList){
        res.status(500).json({success: false});
    }
    res.send(productList);
})

router.get(`/:id`, async (req, res) => {
    //const product = await Product.findById(req.params.id).populate('category');
    const product = await Product.findById(req.params.id);

    if(!product){
        res.status(500).json({success: false});
    }
    res.send(product);
})

router.get(`/get/count`, async (req, res) => {
    //const product = await Product.findById(req.params.id).populate('category');
    const productCount = await Product.countDocuments();

    if(!productCount){
        res.status(500).json({success: false});
    }
    res.send({
        count: productCount
    });
})

router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const featuredProducts = await Product.find({isFeatured: true}).limit(+count);

    if(!featuredProducts){
        res.status(500).json({success: false});
    }
    res.send(featuredProducts);
})

router.post(`/`, async (req, res) => {
    const categoryExist = await Category.findById(req.body.category);

    if(!categoryExist)
        return res.status(400).send('Invalid Category used.');

    const product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    });
    
    product = await product.save();
    if(!product)
        return res.status(500).json({ success: false, message: 'The product cannot be created.'});

    res.send(product);
    // product.save().then(( createdProduct => {
    //     res.status(201).json(createdProduct);
    // })).catch((err) => {
    //     res.status(500).json({
    //         error: err,
    //         success: false
    //     });
    // })
})

router.put(`/:id`, async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id))
        return res.status(400).send('Invalid Product ID.');

    const categoryExist = await Category.findById(req.body.category);
    if(!categoryExist)
        return res.status(400).send('Invalid Category used.');

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            richDescription: req.body.richDescription,
            description: req.body.description,
            image: req.body.image,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        },
        // default returns old data but for new specify for to send to response
        { new : true }
    )

    if(!product)
        return res.status(500).send('The Product could not be updated.');

    res.send(product);
})

router.delete(`/:id`, (req, res) => {
    Product.findByIdAndRemove(req.params.id).then(product => {
        if(product){
            return res.status(200).json({ success: true, message: 'The product was deleted.'});
        }
        else{
            return res.status(404).json({ success: false, message: 'Product not found.'});
        }
    }).catch( err => {
        return res.status(400).json({ success: false, error: err, message: 'Failed to delete the product.'});
    })
})

module.exports = router;