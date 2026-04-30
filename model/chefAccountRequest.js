const mongoose=require("mongoose");

const chefAccountRequestSchema=new mongoose.Schema({
   mobile: {
    type: String,
    required: true,
    unique: true,
  },
  password:{
    type:String,
    required:true,
  },
  name: {
    type: String,
    required: true,
  },

  profileImage: {
    type: String, // Path or URL
    default: "/assets/default-chef.jpg",
  },

  type: {
    type: String,
    enum: [
      "One-Time Service",
      "Chef's Table",
      "Chef for Party",
      "Chef Subscription",
    ],
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  speciality: {
    type: String, // e.g., "Butter Chicken", "Sushi", etc.
    required: true,
  },
  
  experience: {
    type: Number, // in years
    required: true,
  },

  bio: {
    type: String,
    maxlength: 1000,
    required: true,
  },

  certifications: {
    type: [String], // e.g., ["Food Safety Certified", "Culinary Arts Diploma"]
    required: true,
  },
});
module.exports=mongoose.model("ChefAccountRequest",chefAccountRequestSchema)