import ApiEror from '../utils/apiError.js';

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const errors = result.error.issues.map((issue)=>({
            field: issue.path.join("."),
            message: issue.message

        }));
    return next(new ApiEror("Validation Error",400, errors));

    }

    req[source] = result.data;
    next();
  };
};

export default validate;