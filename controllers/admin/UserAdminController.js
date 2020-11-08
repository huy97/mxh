const { baseResponse, logger,defaultStartLimit } = require("../../utils/helper");
const { hasPermission } = require("../../middleware/checkPermission");
const UserAdmin = require("../../models/UserAdmin");
const UserAdminRole = require("../../models/UserAdminRole");
const UserRole = require("../../models/UserRole");
const Perrmisstion = require("../../models/Permisstion");
const { PERMISSION_CODE } = require("../../utils/constant");
const jwt = require("jsonwebtoken");
const bcryptjs = require('bcryptjs');

const adminLogin = async (req, res, next) => {
  try{
    const {username, pwd} = req.body;
    if(!username || !pwd) {
      baseResponse.error(res, 422, 'Vui lòng nhập đầy đủ các trường');
      return;
    }
    const adminUser = username ? await UserAdmin.findOne({username}) : null;
    if(!adminUser) {
      baseResponse.error(res, 422, 'Tài khoản không tồn tại.');
      return;
    }
    const verifyPassword = bcryptjs.compareSync(pwd, adminUser.password);
    if(!verifyPassword){
      baseResponse.error(res, 422, 'Tài khoản hoặc mật khẩu không chính xác.');
      return;
    }
    const tokenExpiredAt = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30);
    const [token] = await Promise.all([
      jwt.sign({uid: adminUser.id,  exp: tokenExpiredAt}, global.privateKey),
    ]);
    adminUser.accessToken = token;
    adminUser.save();
    baseResponse.success(res, 200, 'Đăng nhập thành công.', null, {
      accessToken: token,
  });
  } catch(e){
    console.log(e);
    logger.error(e);
    return baseResponse.error(res);
  }
};

const createAdmin = async (req, res, next) => {
  try {
    const {username, pwd, fullName} = req.body;
    const passwordHash = await bcryptjs.hashSync(pwd, 10);
    let userObj = {
      fullName,
      username,
      password: passwordHash,
      uid: username
    }
    let defaultRoleId = 1;
    const user = await UserAdmin.create(userObj);
    await user.save();
    user.password = '';
   
    await UserRole.create({
      userId: user.id,
      roleId: defaultRoleId
    });

    return baseResponse.json(res, 200, 'Thành công', {
      user
  });
  } catch(e) {
    console.log(e);
    logger.error(e);
    return baseResponse.error(res);
  }
}

const getUser = async (req, res, next) => {
  let roles = [];
  try {
    req.roles.map((role) => {
      role.useradminroles.map((roleTemp) => {
        roles = [...roles, ...roleTemp.permissionCodes];
      });
    });
    roles = Array.from(new Set(roles));
    return baseResponse.success(res, 200, 'Thành công', {info: req.user, permissions: roles})
  } catch(e) {
    console.log(e);
    logger.error(e);
    return baseResponse.error(res);
  }
}

const createPermission = async (req, res, next) => {
  let {code, des } = req.body;
  try {
    await Perrmisstion.create({
      permissionCode:  code,
      permissionDesc: des,
    });
    baseResponse.success(res, 200, 'Thành công')
  } catch (e) {
    console.log(e);
    logger.error(e);
    return baseResponse.error(res);
  }
}

const createRole = async (req, res, next) => {
  const {description, permissionCodes} = req.body;
    try{
        if(hasPermission([PERMISSION_CODE.MANAGER], req.roles)) {
          return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này');
        }
        const total = await UserAdminRole.countDocuments();
        let roleId = total + 1;
        const role = await UserAdminRole.create({
            roleId,
            description,
            permissionCodes
        });
        return baseResponse.success(res, 200, 'Thành công', role);
    }catch(e){
      logger.error(e);
        return baseResponse.error(res);
    }
}

const getListRoles = async (req, res, next) => {
  try{
    if(hasPermission([PERMISSION_CODE.MANAGER, PERMISSION_CODE.READ], req.roles)) {
      return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này');
    }
    const {skip, limit} = defaultStartLimit(req);
    const resultQuery = await UserAdminRole.find({}).skip(skip).limit(limit).sort({createdAt: -1});
    const totalQuery = await UserAdminRole.countDocuments();
    return baseResponse.success(res, 200, 'Thành công', resultQuery, {total: totalQuery})
  }catch(e){
    logger.error(e);
    return baseResponse.error(res);
  }
}

const getPermissions = async (req, res, next) => {
  try{
      const {skip, limit} = defaultStartLimit(req);
      const resultQuery = Perrmisstion.find({}).skip(skip).limit(limit);
      const totalQuery = Perrmisstion.countDocuments();
      const [result, total] = await Promise.all([resultQuery, totalQuery]);
      return baseResponse.success(res, 200, 'Thành công', result, {total: total});
  }catch(e){
    console.log(e);
      return baseResponse.error(res);
  }
}

const updateRole = async (req, res, next) => {
  const {description, permissionCodes, id} = req.body;
  try{
      if(hasPermission([PERMISSION_CODE.MANAGER, PERMISSION_CODE.UPDATE], req.roles)) {
        return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này');
      }
      const result = await UserAdminRole.findOne({roleId: id});
      if(!result) {
        return baseResponse.error(res, 422, 'Không tìm thấy quyền này');
      }
      if(description){
        result.description = description;
      }
      if(permissionCodes && Array.isArray(permissionCodes)){
        result.permissionCodes = permissionCodes;
      }
      result.save();
      return baseResponse.success(res, 200, 'Thành công', result);
  }catch(e){
    console.log(e);
      return baseResponse.error(res);
  }
}

module.exports = {
  adminLogin,
  createAdmin,
  getUser,
  createPermission,
  createRole,
  getListRoles,
  getPermissions,
  updateRole,
}