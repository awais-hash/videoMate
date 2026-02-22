import mongoose from "mongoose"
import {dataBaseName} from "../constants.js"

const connectDB = async()=>{

    try {
        const connection = await mongoose.connect(`${process.env.DATABASE_URI}/${dataBaseName}`)
        console.log("DB connected successfully")
    } catch (error) {
        console.log("There is an error in connection with DB", error)
        process.exit(1)
    }

}
export default connectDB