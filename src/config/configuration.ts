export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongoUri:
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/merkadapp_expenses',
});
