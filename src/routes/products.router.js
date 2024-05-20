import express from 'express';
import { ProductController } from '../controllers/products.controller.js';
import utils from '../utils.js';

const { passportCall } = utils;

const ProductsRouter = express.Router()

const {
    getHome,
    getLogin,
    getSignup,
    getProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct
} = new ProductController();

ProductsRouter.get('/', getHome);

ProductsRouter.get("/login", getLogin);

ProductsRouter.get("/signup", getSignup);

ProductsRouter.get('/products',  passportCall('login', 'user'), getProducts);

ProductsRouter.get('/products/:pid', getProductById);

ProductsRouter.post("/products",addProduct);

ProductsRouter.put("/products/:pid", updateProduct);

ProductsRouter.delete("/products/:pid", deleteProduct);


export default ProductsRouter;