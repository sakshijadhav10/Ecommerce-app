import { comparePassword, hashPassword } from "../helpers/authHelper.js"
import orderModel from "../models/orderModel.js"
import userModel from "../models/userModel.js"
import JWT from "jsonwebtoken"
export const registerController=async (req,res)=>{
try{
    const {name,email,password,phone,address,answer}=req.body
    if(!name){
        return res.send({message:'name is required'})
    }
    if(!email){
        return res.send({message:'email is required'})
    }
    if(!password){
        return res.send({message:'password is required'})
    }
    if(!phone){
        return res.send({message:'phone is required'})
    }
    if(!address){
        return res.send({message:'address is required'})
    }
    if(!answer){
        return res.send({message:'answer is required'})
    }

    //check user
    const existingUser = await userModel.findOne({email})

    if(existingUser){
        return res.status(200).send({
            success:false,
            message:"Already Register please login"
        }

        )
    }
    const hashedPassword=await hashPassword(password);

    const user=await new userModel({name,email,phone,address,password:hashedPassword,answer}).save();

    res.status(201).send({
        success:true,
        message:"user Register Successfully",
        user,
    });
}
catch(error){
     console.log(error);
     res.status(500).send({
        success:false,
        message:"Error in Registration",
        error
     })
}
}

//post login
export const loginController=async(req,res)=>{
    try{
        const {email,password}=req.body

        //validation
        if(!email || !password){
            return res.status(400).send({
                success:false,
                message:"Invalid email or password"
            })
        }
        const user=await userModel.findOne({email})
        if(!user){
            return res.status(400).send({
                success:false,
                message:"Email is not registered"
            })
        }
        const userP=await userModel.find({password})
        if(!userP){
            return res.status(400).send({
                success:false,
                message:"Password is invalid"
            })
        }

        // 
        //token
        const token=await JWT.sign({_id:user._id},process.env.JWT_SECRET,{
            expiresIn:"7d"
        });
        res.status(200).send({
            success:true,
            message:"Login Successfully",
            user:{
                _id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
               role:user.role,
            },
            token
        })
    }
    catch(error){
        console.log(error);
        res.status(500).send({
            success:false,
            message:'error in login',
            error
        })
    }
}

//forgot Password
export const forgotPasswordController=async(req,res)=>{
    try{
        const {email,answer,newPassword}=req.body
        if(!email){
            res.status(400).send({message:"Email is required"})
        }
        if(!answer){
            res.status(400).send({message:"question is required"})
        }
        if(!newPassword){
            res.status(400).send({message:"newPassword is required"})
        }
        //check
        const user=await userModel.findOne({email,answer})
        //validation
        if(!user){
            return res.status(404).send({
                success:false,
                message:"Wrong email or Answer"
            })
           }
           const hashed =await hashPassword(newPassword)
           await userModel.findByIdAndUpdate(user._id,{password:hashed});
           res.status(200).send({
            success:true,
            message:"Password reset successfully",
           })
        }

    catch(error){
        console.log(error);
        res.status(500).send({
            success:false,
            message:'Something went wrong',
        })
    }
}

export const updateProfileController=async (req,res)=>{
    try{
        const {name,email,password,phone,address}=req.body;
        const user=await userModel.findById(req.user._id)

        if(!password && password.length<6){
            return res.json({error:"Password is required and it must be 6character long"})
        }
        const hashedPassword=password? await hashPassword(password):undefined;
        const updatedUser=await userModel.findByIdAndUpdate(req.user._id,{
            name:name ||user.name,
            password:hashedPassword || user.password,
            phone:phone || user.phone,
            address:address || user.address,
         
        },{new:true})
        res.status(200).send({
            success:true,
            message:"Profile Updated successfully",
            updatedUser

        })
    }
    catch(error){
        console.log(error);
        res.status(400).send({
            success:false,
            message:"Error in updating profile",
            error
        })
    }
}
//orders
export const getOrdersController = async (req, res) => {
    try {
      const orders = await orderModel
        .find({ buyer: req.user._id })
        .populate("products", "-photo")
        .populate("buyer", "name");
      res.json(orders);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error WHile Geting Orders",
        error,
      });
    }
  };


  export const getAllOrdersController = async (req, res) => {
    try {
      const {orders} = await orderModel
        .find({})
        .populate("products", "-photo")
        .populate("buyer", "name")
        .sort({ createdAt: "-1" });
      res.json(orders);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error WHile Geting Orders",
        error,
      });
    }
  };
  
  //order status
  export const orderStatusController = async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const {orders} = await orderModel.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      res.json(orders);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error While Updateing Order",
        error,
      });
    }
  };