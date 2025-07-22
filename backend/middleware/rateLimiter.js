const orderAttempts = new Map();

export const orderRateLimit = (req, res, next) => {
  const userId = req.body.userId;
  const now = Date.now();
  const windowMs = 60000; // 1 menit
  const maxAttempts = 5; // Maksimal 5 order per menit
  
  if (!orderAttempts.has(userId)) {
    orderAttempts.set(userId, []);
  }
  
  const attempts = orderAttempts.get(userId);
  
  // Hapus attempts yang sudah expired
  const validAttempts = attempts.filter(time => now - time < windowMs);
  
  if (validAttempts.length >= maxAttempts) {
    return res.json({
      success: false,
      message: "Terlalu banyak percobaan. Coba lagi dalam 1 menit."
    });
  }
  
  validAttempts.push(now);
  orderAttempts.set(userId, validAttempts);
  
  next();
};
