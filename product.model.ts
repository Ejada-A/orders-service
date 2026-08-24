import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProduct extends Document {
  categoryId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
}

const productSchema = new Schema<IProduct>({
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  imageUrl: { type: String, required: true },
});

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
