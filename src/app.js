import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { corsOptions } from "./config/cors.config.js";
import userRoute from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";
import commentRouter from "./routes/comment.route.js";
import likeRouter from "./routes/like.route.js";
import playlistRouter from "./routes/playlist.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import tweetRouter from "./routes/tweet.route.js";
import healthRouter from "./routes/health.route.js";
import errorHandler from "./middlewares/errorHandler.js"; 
import { generalLimiter } from "./middlewares/rateLimit.middleware.js";


const app = express()

app.use(cors(corsOptions));
app.use(express.json({limit: '20kb'}))
app.use(express.urlencoded({extended: true, limit: '20kb'}))
app.use(cookieParser())
app.use(generalLimiter)
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweets", tweetRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    statusCode: 404,
  })})

app.use(errorHandler);

export {app};


