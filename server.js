const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db')

const adminRoutes = require('./routes/adminRoute')
const agentRoutes = require('./routes/agentRoute')
const forexRoutes = require('./routes/forexRoute')
const dashboardRoutes = require('./routes/dashboardRoute')
const reportRoutes = require('./routes/reportRoute')
const uploadRoutes = require('./routes/uploadRoute')
const clientsRoute = require('./routes/clientsRoute')

dotenv.config();
connectDB();



const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes are there
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

app.use('/api/admin', adminRoutes);

app.use('/api/agent', agentRoutes);
app.use('/api/forex', forexRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientsRoute)
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


