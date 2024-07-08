import { ProductManagerMongo } from '../dao/services/managers/ProductManagerMongo.js';
import { CartManagerMongo } from '../dao/services/managers/CartManagerMongo.js';
import { UserRepository } from '../repositories/user.repository.js';

export class CartController {
    constructor(){
        this.productsService = new ProductManagerMongo();
        this.cartsService = new CartManagerMongo();
        this.userService = new UserRepository();
    }

    getCarts = async (req, res) => {
        try {
            let result = await this.cartsService.getCarts()
            res.send({ result: 'success', payload: result });
        } catch (error) {
            req.logger.error(
                `Error al recuperar los carritos: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al obtener los carritos.' });
        }
    }

    getCartById = async (req, res) => {
        try {
            const { cid } = req.params;
            const cart = await this.cartsService.getCartById(cid);

            const productsDetails = [];
            let totalPrice = 0;

            for (const product of cart.products) {
                const productDetails = await this.productsService.getProduct(product.productId);
                const productWithQuantity = { ...productDetails, quantity: product.quantity }; 
                productsDetails.push(productWithQuantity);
                
                const subtotal = productDetails.price * product.quantity;
                totalPrice += subtotal;
            }
            req.logger.debug(
                `${productsDetails}, Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            
            res.render('carts', { cart, productsDetails, totalPrice, cartId: cart._id });
        } catch (error) {
            req.logger.error(
                `Error al recuperar el carrito por ID: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al obtener el carrito.' });
        }
    }
    
    addCart = async (req, res) => {
        let result = await this.cartsService.addCart();
        res.send({ result: 'success', payload: result });
    }
    
    addToCart = async (req, res) => {
        try {
            let { cid, pid } = req.params;
            let userId = req.session.clienId;

            
        if (!cid || !pid) {
            req.logger.error(`Faltan parámetros: cid (${cid}), pid (${pid}).`);
            return res.status(400).send({ error: 'Faltan el ID del carrito o el ID del producto.' });
        }

        const product = await this.productsService.getProduct(pid);
        if (!product) {
            req.logger.error(`Producto no encontrado: pid (${pid}).`);
            return res.status(404).send({ error: 'Producto no encontrado.' });
        }
        req.logger.debug(`Producto encontrado: ${JSON.stringify(product)}. ID del usuario: ${userId}.`);

        if (req.session.role === 'premium' && product.owner && product.owner === userId) {
            req.logger.warning(
                `Usuarios premium no pueden agregar sus propios productos. Producto: ${product._id}, Usuario: ${userId}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            return res.status(403).send({ error: 'No puedes agregar tus propios productos al carrito.' });
        }

        const result = await this.cartsService.addToCart(cid, pid);
        req.logger.debug(`Producto agregado al carrito: ${result}`);
        res.send({ result: 'success', payload: result });
    } catch (error) {
        req.logger.error(
            `Error al agregar el producto al carrito: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
        );
        res.status(500).send({ error: 'Ocurrió un error al agregar el producto al carrito.' });
    }
    }

    updateProductQuantity = async (req, res) => {
        try {
            const { cid, pid } = req.params;
            const { quantity } = req.body;
            const result = await this.cartsService.updateProductQuantity(cid, pid, quantity);
            res.send({ result: 'success', payload: result });
        } catch (error) {
            req.logger.error(
                `Error al actualizar la cantidad del producto en el carrito: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al actualizar la cantidad del producto en el carrito.' });
        }
    }

    updateCart = async (req, res) => {
        try {
            const { cid } = req.params;
            const result = await this.cartsService.updateCart(cid);
            res.send({ result: 'success', payload: result });
        } catch (error) {
            req.logger.error(
                `Error al actualizar el carrito: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al actualizar el carrito.' });
        }
    }

    deleteProduct = async(req, res) => {
        let { cid, pid } = req.params;
        let result = await this.cartsService.deleteProduct(pid, cid);
        res.send({ result: 'success', payload: result });
    }

    deleteAllProducts = async(req, res) => {
        try {
            const { cid } = req.params;
            const result = await this.cartsService.deleteAllProducts(cid);
            res.send({ result: 'success', payload: result });
        } catch (error) {
            req.logger.error(
                `Error al eliminar todos los productos del carrito: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al eliminar todos los productos del carrito.' });
        }
    }

    checkout = async(req, res) => {
        try {
            const { cid } = req.params;
            req.logger.debug(
                `ID del carrito: ${cid}, Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );

            const cart = await this.cartsService.getCartById(cid);
            req.logger.debug(
                `Detalles del carrito: ${cart}, Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );

            const ticket = await this.cartsService.checkout(cart);
            res.redirect(`${cid}/purchase`);
        } catch (error) {
            req.logger.error(
                `Error al procesar la compra: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error al procesar la compra.' });
        }
    }
    
    getPurchase = async (req, res) => {
        try {
            const { cid } = req.params;
            res.json({ message: `¡Compra exitosa para el carrito ${cid}!` });
        } catch (error){
            req.logger.error(
                `Error en la confirmación de la compra: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).send({ error: 'Ocurrió un error en la confirmación de la compra.' });
        }
    }

    getUserCartId = async (req, res) => {
        try {
            const userId = req.user._id;
            req.logger.debug(
                `ID del usuario: ${userId}, Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );

            const user = await this.userService.findById(userId);

            if (user) {
                req.logger.debug(
                    `ID del carrito del usuario: ${user.cart}, Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
                );
                res.status(200).json({ cartId: user.cart });
            } else {
                res.status(404).json({ error: 'Usuario no encontrado.' });
            }
        } catch (error) {
            req.logger.error(
                `Error al recuperar el ID del carrito del usuario: ${error.message}. Método: ${req.method}, URL: ${req.url} - ${new Date().toLocaleDateString()}`
            );
            res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }

}
