import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOrderItem extends Document {
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  unitPrice: number;
  quantity: number;
}

export interface IOrder extends Document {
  userId?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  createdAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const orderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  shippingAddress: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'shipped', 'cancelled'], default: 'pending', required: true },
  createdAt: { type: Date, default: Date.now, required: true },
});

export const OrderItem: Model<IOrderItem> = mongoose.models.OrderItem || mongoose.model<IOrderItem>('OrderItem', orderItemSchema);
export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
