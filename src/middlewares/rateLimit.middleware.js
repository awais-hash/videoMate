import rateLimit from "express-rate-limit";

const generalLimiter = rateLimit(
    {
        windowMS: 15* 60 * 1000,
        max: 100,
        message:{
            success: false,
            message: "Too many requests, Please try gaian later.",
            statusCode : 429,

        },
        standardHeaders: true,
        legacyHeaders: true

        }
    )
const authLimiter = rateLimit( {
        windowMS: 15* 60 * 1000,
        max: 5,
        message:{
            success: false,
            message: "Too many authentication attempts. Please try again after 15 minutes.",
            statusCode : 429,

        },
        standardHeaders: true,
        legacyHeaders: true

        }
   ) 
const uploadLimiter = rateLimit(
     {
        windowMS: 60* 60 * 1000,
        max: 20,
        message:{
            success: false,
            message: "Too many uploads. Please try again later.",
            statusCode : 429,

        },
        standardHeaders: true,
        legacyHeaders: true

        }
)

export{
    generalLimiter,
    authLimiter,
    uploadLimiter
}


