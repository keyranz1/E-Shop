require('dotenv/config');
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler')


//Routes
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const usersRouter = require('./routes/users');
const ordersRouter = require('./routes/orders');


const app = express();
const api = process.env.API_URL;

app.use(cors());
app.options('*', cors());

//Middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use(errorHandler);

//Routers
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/products`, productsRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, ordersRouter);

//DB connection
mongoose.connect(process.env.MongoDb_Connection_String)
.then(() => {
    console.log('Databse connection is ready....');
})
.catch((err) => {
    console.log(err);
})

//Server
app.listen(3000, () => {
    console.log("Server is running on local host. port: 3000. Click on http://localhost:3000");
})