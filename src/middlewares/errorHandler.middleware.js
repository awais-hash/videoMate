import ApiError  from "../utils/ApiError.js";

const errorHandler = (err,req,res,next)=>{

let error = err;
    if (err.name === "ValidationError"){
        const errors = Object.values(err.errors).map((e)=> e.message)
        error = new ApiError(400, "Validation Error", errors)
    }
     if (err.code === 11000){
        const field = Object.keys(err.keyPattern)[0];
        error = new ApiError (409, `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`);
    }
    if (err.name === "CastError"){
        error = new ApiError(400, "Invalid ID format");
    }
     if (err.type === "entity.parse.failed") {
    error = new ApiError(400, "Invalid JSON in request body");
   }

     if (err.code === "LIMIT_FILE_SIZE") {
    error = new ApiError(413, "File too large");
   }

   const statusCode = error.statusCode || 500;
   const messsage = error.message || "Internal Server Error";
   const response = {
    success :false,
    message,
    statusCode,
    errors : error.errors || [],
   };

   if (process.env.NODE_ENV === "development"){
      response.stack = error.stack;
   }
   res.status(statusCode).json(response)

}
export default errorHandler;
   
