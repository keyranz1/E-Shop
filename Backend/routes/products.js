const express = require('express');
const { Category } = require('../models/category');
const { Product } = require('../models/product');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');
        
        if(isValid)
        {
            uploadError = null;
        }
        
        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(' ').join('-');
      const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
  })
  
const uploadOptions = multer({ storage: storage })

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

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const categoryExist = await Category.findById(req.body.category);

    if(!categoryExist)
        return res.status(400).send('Invalid Category used.');

    if(!req.file)
        return res.status(400).send('No image in the request.');    

    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;    

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${req.file.filename}`,
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

router.put(`/:id`, uploadOptions.single('image'), async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id))
        return res.status(400).send('Invalid Product ID.');

    const categoryExist = await Category.findById(req.body.category);
    if(!categoryExist)
        return res.status(400).send('Invalid Category used.');
    
    const product = await Product.findById(req.params.id);
    if(!product)
    {
        return res.status(400).send('Invalid product!');
    }    

    const file = req.file;
    let imagepath;
    
    if(file)
    {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;  
        imagepath = `${basePath}${fileName}`
    }
    else
    {
        imagepath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            richDescription: req.body.richDescription,
            description: req.body.description,
            image: imagepath,
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

    if(!updatedProduct)
        return res.status(500).send('The Product could not be updated.');

    res.send(updatedProduct);
})

router.put(`/gallery-images/:id`, uploadOptions.array('images', 10), async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id))
        return res.status(400).send('Invalid Product ID.');

    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;        
    let imagesPaths = [];
    if(req.files)
    {
        req.files.map(file => {
            imagesPaths.push(`${basePath}${file.fileName}`);
        })
    } 

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        // default returns old data but for new specify for to send to response
        { new : true }
    ) 
    
    if(!product)
        return res.status(500).send('The Product could not be updated.');

    res.send(product);
});

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