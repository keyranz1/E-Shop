const express = require('express');
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

router.post(`/`, async(req, res) => {

    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        });

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }));

    let order = new Order({
        orderItems : await orderItemsIds,
        shippingAdress1: req.body.shippingAdress1,
        shippingAdress2: req.body.shippingAdress2,
        city : req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: req.body.totalPrice,
        user: req.body.user
    })

    order = await order.save();

    if(!order)
    {
        return res.status(404).send('The Order cannot be created.');
    }

    res.send(order);
})

module.exports = router;