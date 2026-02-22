import dotenv from "dotenv";
import connectDB from "./db/index.js"
import app from "./app.js"

dotenv.config({ path: './.env' });

connectDB().then(()=>{
    app.listen(process.env.PORT || 300,()=>{
        console.log("server is running")
    })
}).catch((error)=>{
console.log("Server is not running on port",error)
})



