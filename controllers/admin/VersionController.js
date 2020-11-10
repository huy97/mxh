const { baseResponse, logger, defaultStartLimit } = require("../../utils/helper");
const Version = require("../../models/Version");
const { hasPermission } = require("../../middleware/checkPermission");
const { PERMISSION_CODE, OS } = require("../../utils/constant");
const { base } = require("../../models/Version");

const createVersion = async (req, res, next) => {
  try {
    if(!hasPermission([PERMISSION_CODE.MANAGER, PERMISSION_CODE.CREATE], req.roles)) {
      return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này');
    }
    const {os, versionCode, versionName, desc, isUpdate} = req.body;
    if(!versionCode || !versionName || !os || !isUpdate) {
      return baseResponse.error(res, 422, 'Vui lòng nhập đầy đủ các trường');
    }
    if(os != OS.ANDROID && os != OS.IOS) {
      return baseResponse.error(res, 422, 'Thông tin hệ điều hành không chính xác');
    }
    let ver = await Version.create({
      versionCode: versionCode,
      versionName: versionName,
      os: os,
      desc: desc,
      isUpdate: isUpdate === "true" ? true : false,
    });
    return baseResponse.success(res, 200, 'Thành công', ver);
  } catch (error) {
    logger.error(error);
    return baseResponse.error(res);
  }
}

const getVersion = async (req, res, next) => {
  try {
    if(!hasPermission([PERMISSION_CODE.MANAGER, PERMISSION_CODE.READ], req.roles)) {
      return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này');
    }
    const {start, limit} = defaultStartLimit(req);
    const {os} = req.query;
    let findOS = os ? os : -1;
    let versionList = await Version.find({os: findOS}).sort({versionCode: -1}).skip(start).limit(limit);
    let total = await Version.countDocuments({os:findOS});
    return baseResponse.success(res, 200, 'Thành công', versionList ? versionList : [], {total: total});
  } catch (error) {
    logger.error(error);
    return baseResponse.error(res);
  }
}

const deleteVersion = async (req, res, next) => {
  try {
    if(!hasPermission([PERMISSION_CODE.MANAGER, PERMISSION_CODE.DELETE], req.roles)) {
      return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này');
    }
    const {id} = req.body;
    const version = await Version.findById(id);
    if(!version){
      return baseResponse.error(res, 422, 'Version không tồn tại.');
    }
    await version.remove();
    return baseResponse.success(res, 200, 'Thành công', version);
  } catch (error) {
    logger.error(error);
    return baseResponse.error(res);
  }
}

const updateVersion = async (req, res, next) => {
  try {
    if(!hasPermission([PERMISSION_CODE.MANAGER, PERMISSION_CODE.DELETE], req.roles)) {
      return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này');
    }
    const {id, versionName, desc, isUpdate} = req.body;
    const version = await Version.findById(id);
    if(!version){
      return baseResponse.error(res, 422, 'Version không tồn tại.');
    }
    version.versionName = versionName;
    version.desc = desc;
    version.isUpdate = isUpdate;
    await version.save();
    return baseResponse.success(res, 200, 'Thành công', version);
  } catch (error) {
    logger.error(error);
    return baseResponse.error(res);
  }
}

const checkVersion = async (req, res, next) => {
  try {
    const {os, versionCode} = req.body;
    let versionList = await Version.find({os: os}).sort({createAt: -1});
    let isNew = false;
    update = false;
    logger.info(versionList);
    if(versionList && versionList.length > 0) {
      if(versionCode != versionList[0].versionCode) {
        isNew = true;
      }
      update = versionList[0].isUpdate;
    }
    return baseResponse.success(res, 200, 'Thành công', {isNew, update})
  } catch (exception) {
    logger.error(error);
    return baseResponse.error(res);
  }
}

module.exports = {
  createVersion,
  getVersion,
  deleteVersion,
  updateVersion,
  checkVersion,
}

