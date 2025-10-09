const getBusinessTypeModel = require("../models/businessType");

exports.createBusinessType = async(req, res) => {

    try{
        const {businessTypeName} = req.body;
        const superAdminId = req.superAdmin._id;
        
        const businessType = getBusinessTypeModel();
        
        const checkTypeName = await businessType.findOne({buisnessTypeName: businessTypeName});
        if(!checkTypeName){
            const business = await businessType.create({
                businessTypeName,
                createdBy: superAdminId
            });
            res.status(201).json({ message: "business Type Created", business})
        }else{
            res.status(500).json({message: "Business Type AllReady Created"})
        }
        
    }catch(err){
        console.log(err)
        res.status(500).json({message:"Server Error"});
    }
};


exports.fetchBusinessType = async(req, res)=>{
    try{

        const superAdminId = req.superAdmin._id;
        const businessType = getBusinessTypeModel();
        
        const business = await businessType.find({createdBy: superAdminId});
        res.json(business);

    }catch(err){
        res.status(500).json({message: err})
    }
}