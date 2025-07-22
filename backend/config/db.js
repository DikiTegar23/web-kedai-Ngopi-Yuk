import mongoose from "mongoose";

export const connectDB = async () => {
    await mongoose.connect('mongodb+srv://dikitegarr62:Dikitgr232@cluster0.eqqa3b3.mongodb.net/warkop-5s').then(()=>console.log("DB Connected"));
}