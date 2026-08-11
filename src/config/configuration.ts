export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongoUri:
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/merkadapp_expenses',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim()),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // .env can't hold real newlines, so the key is stored with literal "\n"
    // sequences and unescaped here before handing it to firebase-admin.
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});
