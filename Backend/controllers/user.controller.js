import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req , res) => {
    try {
        const { username , email , password } = req.body;
        if (!username || !email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false
            });
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "Try different email.",
                success: false
            });
        }
        const hashedPassword = await bcrypt.hash(password , 10);
        await User.create({
            username,
            email,
            password:hashedPassword
        });
        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};

export const login = async (req , res) => {
    try {
        const { email , password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false
            });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Incorrect password or email.",
                success: false
            });
        }
        const isPasswordMatch = await bcrypt.compare(password , user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Incorrect password or email.",
                success: false
            });
        }

        user = {
            _id:user._id , 
            username:user.username ,
            email:user.email ,
            profilePicture:user.profilePicture ,
            bio:user.bio ,
            followers:user.followers ,
            following:user.following ,
            posts:user.posts 
        }

        const token = await jwt.sign({userID:user._id},process.env.SECRET_KEY , {expiresIn:'1d'});
        return res.cookie('token' , token , {httpOnly:true , sameSite:'strict' , maxAge: 1*24*60*60*1000}).json({
            message:`Welcome back ${user.username}`,
            success:true
        });

    } catch (error) {
        console.log(error);
    }
};

export const logout = async (_ , res) => {
    try {
        return res.cookie("token" , "" , {maxAge:0}).json({
            message:'Logged out successfully.',
            success:true
        });
    } catch (error) {
        console.log(error);
    }
};

export const getProfile = async(req , res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId);
        return res.status(200).json({
            user ,
            success:true
        });
    } catch (error) {
        console.log(error);
    }
};

export const editProfile = async(req , res) => {
    try {
        const userId = req.id;
        const {bio , gender} = req.body;
        const profitPicture = req.file;
        let cloudResponse;

        if(profitPicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user =  await User.findById(userId);

        if(!user) {
            return res.status(404).json({
                message:'User not found.' , 
                success: false
            });
        }
        if(bio) user.bio = bio;
        if(gender) user.gender = gender;
        if(profitPicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message:'Profile updated.' , 
            success: true ,
            user
        });

    } catch (error) {
        console.log(error);
    }
};

export const getSuggestedUsers = async(req , res) => {
    try {
        const suggestedUsers = await User.find(_id:{$ne:req.id}).select("-password");

        if(suggestedUsers) {
            return res.status(400).json({
                message:'Currently do not have any users.' ,
            });
        }
        return res.status(200).json({
            success:true ,
            users: suggestedUsers
        })

    } catch (error) {
        console.log(error);
    }
};
 
export const followOrUnfollow = async (req , res) => {
    try {
        const followKrneWala = req.id; // me
        const jiskoFollowKarungi = req.params.id; // my friend
        if(followKrneWala === jiskoFollowKarungi) {
            return res.status(400).json({
                message: 'You cant follow or unfollow yourself' ,
                success:false
            });
        }

        const user = await User.findById(followKrneWala);
        const targetUser = await User.findById(jiskoFollowKarungi);

        if(!user || !targetUser) {
            return res.status(400).json({
                message:'User not found' ,
                success: false
            })
        }

        // mai check karunga ki follow krna hai ya unfollow
        const isFollowing = user.following.includes(jiskoFollowKarungi);

        if(isFollowing) {
            //follow
            await Promise.all([
                User.updateOne({_id: followKrneWala }, { $push: { following: jiskoFollowKarungi } }) ,
                User.updateOne({_id: jiskoFollowKarungi }, { $push: { followers: followKrneWala } }) ,
            ])
            return res.status(200).json({
                message:'Followed successfully' ,
                success: true
            });
        } else {
            //unfollow
            await Promise.all([
                User.updateOne({_id: followKrneWala }, { $pull: { following: jiskoFollowKarungi } }) ,
                User.updateOne({_id: jiskoFollowKarungi }, { $pull: { followers: followKrneWala } }) ,
            ])
            return res.status(200).json({
                message:'Unfollowed successfully' ,
                success: true
            });
        }
    } catch (error) {
        console.log(error);
    }
}

