class ApiError extends Error{
    constructor (message = "Something wrong...", statusCode, errors =[], stack =""

    ){
        super(message);
        this.message = message;
        this.errors = errors;
        this.statusCode = statusCode;
        if (stack){
        this.stack = stack;
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
    
}

export default ApiError;