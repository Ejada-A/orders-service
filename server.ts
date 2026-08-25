import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order, OrderItem } from './order.model';
import { Product } from './product.model';

dotenv.config();
dotenv.config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Orders service connected to MongoDB'))
  .catch((err) => console.error('Orders service MongoDB connection error:', err));

// Get All Orders
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    const serialized = orders.map((order: any) => ({
      ...order,
      _id: order._id.toString(),
      userId: order.userId?.toString() || null,
    }));
    return res.status(200).json({ success: true, orders: serialized });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Create Order (equivalent to original src/app/api/orders/route.ts logic)
app.post('/orders', async (req, res) => {
  try {
    const { customerName, customerEmail, shippingAddress, items, userId } = req.body;

    if (!customerName || !customerEmail || !shippingAddress || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required order details' });
    }

    // Verify prices and calculate total from DB to prevent client-side manipulation
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item._id || item.productId);
      if (!product) {
        return res.status(400).json({ success: false, error: `Product ${item._id || item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, error: `Insufficient stock for ${product.name}` });
      }

      totalAmount += product.price * item.quantity;
      validatedItems.push({
        productId: product._id,
        unitPrice: product.price,
        quantity: item.quantity,
      });

      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create the order
    const order = new Order({
      userId: userId || null,
      customerName,
      customerEmail,
      shippingAddress,
      totalAmount,
      status: 'pending',
    });

    await order.save();

    // Create the order items
    const orderItems = validatedItems.map(item => ({
      ...item,
      orderId: order._id,
    }));

    await OrderItem.insertMany(orderItems);

    return res.status(201).json({ success: true, orderId: order._id });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Update Order Status
app.patch('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'healthy', service: 'orders-service' });
});

app.listen(PORT, () => {
  console.log(`Orders service running on port ${PORT}`);
});

