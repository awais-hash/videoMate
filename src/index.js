import dotenv from "dotenv";
import connectDB from "./db/index.js"
import {app} from "./app.js"
import dns from 'dns';

dotenv.config({ path: './.env' });
dns.setServers(['8.8.8.8', '1.1.1.1']);
connectDB().then(()=>{
    app.listen(process.env.PORT || 3000,()=>{
        console.log("server is running")
    })
}).catch((error)=>{
console.log("Server is not running on port",error)
})
