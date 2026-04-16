const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
    if (isConnected) return;

    try {
        const db = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = db.connections[0].readyState;
        console.log("MongoDB conectado");
    } catch (err) {
        console.error("Erro ao conectar no MongoDB:", err);
        throw err;
    }
}

module.exports = connectDB;