const getBusinessVolumeModel = require("../models/businessVolume");

exports.createBusinessVolume = async(req, res) => {

    try{
        const {businessVolumeName} = req.body;
        const superAdminId = req.superAdmin._id;
        
        const businessVolume = getBusinessVolumeModel();
        
        const checkVolumeName = await businessVolume.findOne({buisnessVolumeName: businessVolumeName});
        if(!checkVolumeName){
            const business = await businessVolume.create({
                businessVolumeName,
                createdBy: superAdminId
            });
            res.status(201).json({ message: "business Volume Created", business})
        }else{
            res.status(500).json({message: "Business Volume AllReady Created"})
        }
        
    }catch(err){
        console.log(err)
        res.status(500).json({message:"Server Error"});
    }
};


exports.fetchBusinessVolume = async(req, res)=>{
    try{

        const superAdminId = req.superAdmin._id;
        const businessType = getBusinessVolumeModel();
        
        const business = await businessType.find({createdBy: superAdminId});
        res.json(business);

    }catch(err){
        res.status(500).json({message: err})
    }
}