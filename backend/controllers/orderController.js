import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import { isValidObjectId, isValidPrice, sanitizeString } from "../utils/validation.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Validasi input (sama seperti sebelumnya)
const validateOrderInput = (req, res) => {
  const { userId, items, amount, address } = req.body;
  
  if (!userId || !items || !amount || !address) {
    return {
      success: false,
      message: "Data tidak lengkap. Pastikan semua field terisi."
    };
  }
  
  if (typeof userId !== 'string' || !isValidObjectId(userId)) {
    return {
      success: false,
      message: "User ID tidak valid"
    };
  }
  
  if (!Array.isArray(items) || items.length === 0) {
    return {
      success: false,
      message: "Keranjang belanja kosong"
    };
  }
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item.name || typeof item.name !== 'string') {
      return {
        success: false,
        message: `Nama item ke-${i + 1} tidak valid`
      };
    }
    
    if (!isValidPrice(item.price)) {
      return {
        success: false,
        message: `Harga item "${item.name}" tidak valid`
      };
    }
    
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100) {
      return {
        success: false,
        message: `Jumlah item "${item.name}" harus antara 1-100`
      };
    }
    
    item.name = sanitizeString(item.name);
  }
  
  if (typeof amount !== 'number' || amount <= 0) {
    return {
      success: false,
      message: "Total pembayaran tidak valid"
    };
  }
  
  if (typeof address !== 'object' || address === null) {
    return {
      success: false,
      message: "Format alamat tidak valid"
    };
  }
  
  return null;
};

// 🔥 PERBAIKAN: Konversi yang lebih akurat
const convertIDRtoUSDCents = (idrAmount) => {
  // Rate yang lebih akurat: 1 USD = 15,500 IDR
  const exchangeRate = 15500;
  const usdAmount = idrAmount / exchangeRate;
  const usdCents = Math.round(usdAmount * 100);
  
  // Minimal 50 cents
  return Math.max(usdCents, 50);
};

// 🔥 FUNGSI BARU: Format harga untuk display
const formatPriceDisplay = (idrPrice, usdCents) => {
  const usdAmount = usdCents / 100;
  return `Rp ${idrPrice.toLocaleString('id-ID')} (~$${usdAmount.toFixed(2)})`;
};

const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173";
  
  try {
    const validationError = validateOrderInput(req, res);
    if (validationError) {
      return res.json(validationError);
    }
    
    const userExists = await userModel.findById(req.body.userId);
    if (!userExists) {
      return res.json({
        success: false,
        message: "User tidak ditemukan"
      });
    }

    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });
    
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // 🔥 PERBAIKAN: Tampilkan harga IDR yang jelas
    const line_items = req.body.items
      .filter((item) => item.price >= 1 && item.quantity > 0)
      .map((item) => {
        const usdCents = convertIDRtoUSDCents(item.price);
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              description: `Harga: Rp ${item.price.toLocaleString('id-ID')} | Kedai Kopi Indonesia`, // 🔥 TAMBAH DESKRIPSI
            },
            unit_amount: usdCents,
          },
          quantity: item.quantity,
        };
      });

    if (line_items.length === 0) {
      return res.json({
        success: false,
        message: "Tidak ada item valid untuk diproses"
      });
    }

    // 🔥 PERBAIKAN: Delivery charges dengan deskripsi jelas
    const deliveryUsdCents = convertIDRtoUSDCents(20000);
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Ongkos Kirim",
          description: "Biaya pengiriman: Rp 20,000 | Kedai Kopi Indonesia",
        },
        unit_amount: deliveryUsdCents,
      },
      quantity: 1,
    });

    // 🔥 HITUNG TOTAL UNTUK DISPLAY
    const totalIDR = req.body.amount + 20000; // Total items + delivery
    const totalUSDCents = line_items.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0
    );
    const totalUSD = totalUSDCents / 100;

    console.log("🛒 RINGKASAN PESANAN:");
    console.log("📦 Items:", req.body.items.map(item => 
      `${item.name} x${item.quantity} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`
    ));
    console.log("🚚 Ongkir: Rp 20,000");
    console.log("💰 Total IDR: Rp", totalIDR.toLocaleString('id-ID'));
    console.log("💵 Total USD: $", totalUSD.toFixed(2));
    console.log("📊 Exchange Rate: 1 USD = 15,500 IDR");

    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
      metadata: {
        orderId: newOrder._id.toString(),
        userId: req.body.userId,
        totalIDR: totalIDR.toString(),
        exchangeRate: "15500"
      },
      // 🔥 TAMBAHAN: Custom text untuk user
      locale: 'en', // Bisa diganti ke 'id' jika Stripe support
      payment_method_types: ['card'],
      billing_address_collection: 'required',
    });

    console.log("✅ Stripe session berhasil dibuat!");
    console.log("🔗 Session URL:", session.url);

    res.json({ 
      success: true, 
      session_url: session.url,
      // 🔥 TAMBAHAN: Info untuk frontend
      summary: {
        totalIDR: totalIDR,
        totalUSD: totalUSD.toFixed(2),
        exchangeRate: "1 USD = 15,500 IDR",
        note: "Pembayaran menggunakan USD karena keterbatasan Stripe IDR"
      }
    });
    
  } catch (error) {
    console.error("❌ Order placement error:", error.message);
    
    if (error.code === 'amount_too_small') {
      return res.json({
        success: false,
        message: "Total pembayaran terlalu kecil. Minimal $0.50 USD (≈ Rp 7,750)"
      });
    }
    
    res.json({ 
      success: false, 
      message: "Terjadi kesalahan saat memproses pesanan. Silakan coba lagi." 
    });
  }
};

// Export functions yang sama
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
