import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const productCollection = 'products';

const productSchema = new mongoose.Schema({
    title: { type: String, required: true, max: 150, index: true },
    description: { type: String, required: true, max: 300 },
    code: { type: String, required: true, max: 10, unique: true, index: true },
    price: { type: Number, required: true },
    status: { type: Boolean, required: false, default: true },
    stock: { type: Number, required: true, integer: true },
    category: { type: String, required: true, max: 20, index: true },
    thumbnail: { type: Array, required: false },
}); 

productSchema.plugin(mongoosePaginate);

const productModel = mongoose.model(productCollection, productSchema);

export default productModel;
