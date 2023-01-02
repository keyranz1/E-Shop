const express = require('express');
const { Promise } = require('mongoose');
const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');
const router = express.Router();

router.get(`/`, async (req, res) => {
    const orderList = await Order.find().populate('user', 'name' ).sort({'dateCreated': -1});

    //if need to populate extra field then append multiple .populate('orderItems');
    //if need to sort then add . sort('dateOrdered')
    //if need to sort then in order of newest first . sort({'dateOrdered':-1})

    if(!orderList){
        res.status(500).json({success: false});
    }
    res.send(orderList);
})

router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name' )
        .populate({ 
            path: 'orderItems', populate: { 
                path: 'product', populate: 'category'} 
        });

        //.populate({ path: 'orderItems', populate: { path: 'product', select: 'name', populate: 'category'} });
        //.populate({ path: 'orderItems', populate: 'product', });
    if(!order){
        res.status(500).json({success: false});
    }
    res.send(order);
})

router.get(`/get/totalsales`, async (req, res) => {
    const totalSales = await Order.aggregate([
        {
            $group: { _id: null, totalsales: { $sum: '$totalPrice'}}
        }
    ])

    if(!totalSales){
        res.status(400).send('The order sales cannot be generated');
    }
    res.send({totalSales: totalSales});
    //({totalSales: totalSales.pop().totalSales});
})

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments();

    if(!orderCount){
        res.status(500).json({success: false});
    }
    res.send({
        count: orderCount
    });
})

router.get(`/get/userorders/:userid`, async (req, res) => {
    const userOrderList = await Order.find({user: req.params.userid}).populate({ 
        path: 'orderItems', populate: { 
            path: 'product', populate: 'category'} 
    }).sort({'dateCreated': -1});

    if(!userOrderList){
        res.status(500).json({success: false});
    }
    res.send(userOrderList);
})

router.post(`/`, async(req, res) => {

    const orderItemsIds = await Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        });

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }));

    const totalPrices = await Promise.all(orderItemsIds.map(async orderItemId => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        return orderItem.product.price * orderItem.quantity;
    }))

    const totalPrice = totalPrices.reduce((a,b) => a+b,0);

    let order = new Order({
        orderItems : orderItemsIds,
        shippingAdress1: req.body.shippingAdress1,
        shippingAdress2: req.body.shippingAdress2,
        city : req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user
    })

    order = await order.save();

    if(!order)
    {
        return res.status(404).send('The Order cannot be created.');
    }

    res.send(order);
})

router.put(`/:id`, async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        { new : true }
    )

    if(!order)
        return res.status(404).send('The Order could not be updated.');

    res.send(order);
})

router.delete(`/:id`, (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if(order){
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem); //orderItem._id
            })
            return res.status(200).json({ success: true, message: 'The order was deleted.'});
        }
        else{
            return res.status(404).json({ success: false, message: 'Order not found.'});
        }
    }).catch( err => {
        return res.status(400).json({ success: false, error: err, message: 'Failed to delete the order.'});
    })
})

module.exports = router;