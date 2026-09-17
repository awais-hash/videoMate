import ApiEror from '../utils/ApiError.js';

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const errors = result.error.issues.map((issue)=>({
            field: issue.path.join("."),
            message: issue.message

        }));
    return next(new ApiEror(400,"Validation Error", errors));

    }

    req[source] = result.data;
    next();
  };
};

export default validate;