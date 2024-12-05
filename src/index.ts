import express from 'express';
import cors from 'cors';
import userRoute from './routes/userRoutes';
import itemsRoute from './routes/itemRoutes';
import dotenv from 'dotenv';

dotenv.config();

const PORT: number = 5000;
const app = express();
app.use(cors());

app.use('/api/auth', userRoute);
app.use('/api/inventory', itemsRoute);


app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
