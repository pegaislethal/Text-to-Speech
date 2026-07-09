require('dotenv').config();
// Set fallback DNS servers to resolve MongoDB Atlas SRV records reliably
try {
  require('dns').setServers(['1.1.1.1', '8.8.8.8']);
} catch (dnsErr) {
  console.warn('Failed to set fallback DNS servers:', dnsErr.message);
}
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
