import mongoose, {isValidObjectId} from "mongoose";
import  asyncHandler  from "../utils/asyncHandler.js";
import  ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler((req,res)=>{
   const {channelId} = req.params;
   if (!channelId || !isValidObjectId(channelId)){
    throw new ApiError (404, "Valid channelId is required");
   }

   if (!req.user?._id){
    throw new ApiError(404, "Unathorized Request")
   }
   if (channelId.toString() === req.user._id.toString()){
    throw new ApiError(400, "You can't subscribe to yourself");
   }
   
   const existingSubscription = await Subscription.findOne({
    subscriber : req.user?._id,
    channel : channelId
   })

   if (existingSubscription){
    await Subscription.findByIdAndDelete(existingSubscription._id)
    return res.status(200).
    json(new ApiResponse(200, {}, "Unsubscribed Successfully"))
   }

   await Subscription.create({
    subscriber : req.user?._id,
    channel: channelId
   })

   return res.status(200).json(
    new ApiResponse(200, {}, "Channel Subscribed Successfully")
   )
});

const getSubscribedChannels = asyncHandler((req,res)=>{
   if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized Request"); 
  }
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(req.user?._id)
            }

        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as : "channel",
                pipeline:[
                    {
                        $project:{
                            userName:1,
                            fullName:1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                channel:{
                    $first: "$channel"
                }
            },

        },
        {
            $project: {
                id:0,
                channel: 1,
                createdAt: 1,


            }
        }
    ])

     return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,   
        "Subscribed channels fetched successfully"
      ))
})
const getChannelSubscribers = asyncHandler(async (req, res) => {
   if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized Request"); 
  }
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: { $first: "$subscriber" },
      },
    },
    {
      $project: {
        _id: 0,
        subscriber: 1,
        createdAt: 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "Channel subscribers fetched successfully"
      )
    );
});

export { toggleSubscription, getSubscribedChannels, getChannelSubscribers };

