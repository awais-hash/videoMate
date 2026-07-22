import mongoose, { disconnect } from "mongoose";


const healthCheck = async (req,res)=>{

const health= {
    status : 200,
    timestamp : new Date().toISOString(),
    uptime: process.uptime(),
    environment :process.env.NODE_ENV || "development",
    database:{
            status: disconnected
    },
    memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB",
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
    }
 }

 try {
    const dbreadyState = mongoose.connection.readyState;
    health.database= {
        status : dbreadyState ===  1? "connected": "disconnected",
        state :  ["disconnected", "connected", "connecting", "disconnecting"][dbreadyState], 
    } 
    
 } catch (error) {
    health.database.status = "error";
    health.database.error = error.msg;
 }
   const databaseStatus = health.database.status === 1 ? 200: 503;
   res.status(databaseStatus).json(health)

}

export default healthCheck;
