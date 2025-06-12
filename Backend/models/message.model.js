import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderID:{
        type:mongoose.Schema.Types.ObjectId , 
        ref:'User' 
    },
    receiverID:{
        type:mongoose.Schema.Types.ObjectId , 
        ref:'Post' 
    },
    message:{
        type:String , 
        required:true
    }
});

export default Message = mongoose.model('Message' , messageSchema);
    