mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,          // reuse connections instead of creating new ones
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});