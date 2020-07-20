const {baseResponse} = require('../../utils/helper');
const {set, get, redisClient} = require('../../utils/redis');
const Province = require('../../models/Province');
const District = require('../../models/District');
const SubDistrict = require('../../models/SubDistrict');

const getProvinces = async (req, res, next) => {
    try{
        let provinces = JSON.parse(await get("list_provinces"));
        if(!provinces || !Array.isArray(provinces) || !provinces.length){
            provinces = await Province.find({});
            set("list_provinces", JSON.stringify(provinces));
            redisClient.expire("list_provinces", 86400);
        }
        baseResponse.success(res, 200, "Thành công", provinces);
    }catch(e){
        baseResponse.error(res);
    }
};

const getDistricts = async (req, res, next) => {
    try{
        const {provinceId} = req.params;
        let districts = JSON.parse(await get(provinceId));
        if(!districts || !Array.isArray(districts) || !districts.length){
            districts = await District.find({parentCode: provinceId});
            set(provinceId, JSON.stringify(districts));
            redisClient.expire(provinceId, 3600);
        }
        baseResponse.success(res, 200, "Thành công", districts);
    }catch(e){
        baseResponse.error(res);
    }
};

const getSubDistricts = async (req, res, next) => {
    try{
        const {districtId} = req.params;
        let subDistricts = JSON.parse(await get(districtId));
        if(!subDistricts || !Array.isArray(subDistricts) || !subDistricts.length){
            subDistricts = await SubDistrict.find({parentCode: districtId});
            set(districtId, JSON.stringify(subDistricts));
            redisClient.expire(districtId, 3600);
        }
        baseResponse.success(res, 200, "Thành công", subDistricts);
    }catch(e){
        baseResponse.error(res);
    }
};


module.exports = {
    getProvinces,
    getDistricts,
    getSubDistricts
}