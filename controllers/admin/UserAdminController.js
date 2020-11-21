const { baseResponse, logger,defaultStartLimit } = require("../../utils/helper");
const { hasPermission } = require("../../middleware/checkPermission");
const UserAdmin = require("../../models/UserAdmin");
const UserAdminRole = require("../../models/UserAdminRole");
const UserRole = require("../../models/UserRole");
const Perrmisstion = require("../../models/Permisstion");
const { PERMISSION_CODE } = require("../../utils/constant");
const jwt = require("jsonwebtoken");
const bcryptjs = require('bcryptjs');
const { Types } = require("mongoose");
const {validationResult} =  require("express-validator");

const adminLogin = async (req, res, next) => {
  try{
    const {username, pwd} = req.body;
    if(!username || !pwd) {
      baseResponse.error(res, 422, 'Vui lòng nhập đầy đủ các trường');
      return;
    }
    const adminUser = await UserAdmin.findOne({username});
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
    logger.error(e);
    return baseResponse.error(res);
  }
};

const adminLogout = async (req, res, next) => {
  try{
    let user = await UserAdmin.findOne({_id: req.user._id});
    if(user) {
      user.accessToken = '';
      user.save();
    }
    baseResponse.success(res, 200, 'Đăng xuất thành công.');
  }catch(e) {
    logger.error(e);
    return baseResponse.error(res);
  }
}

const createAdmin = async (req, res, next) => {
  try {
    const {username, pwd, fullName} = req.body;
    if(!hasPermission([PERMISSION_CODE.MANAGER], req.roles)) {
      return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này');
    }
    const passwordHash = await bcryptjs.hashSync(pwd, 10);
    let userObj = {
      fullName,
      username,
      password: passwordHash,
      uid: username
    }
    let defaultRoleId = 2;
    const user = await UserAdmin.create(userObj);
    await user.save();
    user.password = '';   
    await UserRole.create({
      userId: user.id,
      roleId: defaultRoleId
    });
    let match = {
      _id: Types.ObjectId(user.id)
    };
    let result = await UserAdmin.aggregate([
      {
          $match: match
      },
      {
          $lookup: {
              from: 'user_roles',
              localField: "_id",
              foreignField: "userId",
              as: 'roles'
          }
      },
      {
          $lookup: {
              from: 'useradminroles',
              localField: "roles.roleId",
              foreignField: "roleId",
              as: 'roles'
          }
      }
    ]);
    return baseResponse.json(res, 200, 'Thành công', {data: result[0]});
  } catch(e) {
    logger.error(e);
    return baseResponse.error(res);
  }
}

const getUser = async (req, res, next) => {
  try {
    roles = Array.from(new Set(req.roles));
    return baseResponse.success(res, 200, 'Thành công', {info: req.user, permissions: roles})
  } catch(e) {
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
    logger.error(e);
    return baseResponse.error(res);
  }
}

const createRole = async (req, res, next) => {
  const {description, permissionCodes} = req.body;
    try{
        // if(!hasPermission([PERMISSION_CODE.MANAGER], req.roles)) {
        //   return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này');
        // }
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
    if(!hasPermission([PERMISSION_CODE.MANAGER, PERMISSION_CODE.READ], req.roles)) {
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
      return baseResponse.error(res);
  }
}

const updateRole = async (req, res, next) => {
  const {description, permissionCodes, id} = req.body;
  try{
      if(!hasPermission([PERMISSION_CODE.MANAGER, PERMISSION_CODE.UPDATE], req.roles)) {
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
      return baseResponse.error(res);
  }
}

const deleteRole = async (req, res, next) => {
  const {roleId} = req.body;
  try{
      if(roleId == 1 || roleId == 2 || roleId == 3 || roleId == 4 || roleId == 5 || roleId == 6) {
        return baseResponse.success(res, 422, 'Không thể xóa các quyền mặc định');
      } 
      const role = await UserAdminRole.deleteOne({roleId});
      return baseResponse.success(res, 200, 'Thành công');
  }catch(e){
      return baseResponse.error(res);
  }
}

const changePassword = async (req, res, next) => {
  try {
    let userAdmin = await UserAdmin.findById({_id: req.user._id});
    let {oldPassword, newPassword} = req.body;
    const verifyPassword = bcryptjs.compareSync(oldPassword, userAdmin.password);
    if(!verifyPassword) {
      return baseResponse.error(res, 422, 'Mật khẩu hiển tại không chính xác');
    }
    if(oldPassword == newPassword) {
      return baseResponse.error(res, 422, 'Mật khẩu mới trùng với mật khẩu cũ');
    }
    const passwordHash = await bcryptjs.hashSync(newPassword, 10);
    userAdmin.password = passwordHash;
    userAdmin.save();
    return baseResponse.success(res, 200, 'Thành công');
  }catch(e) {
    return baseResponse.error(res);
  }
}

const getListUserAdmin = async (req, res, next) => {
  try {
    const {start, limit} = defaultStartLimit(req);
    let match = {};
    let listUser = UserAdmin.aggregate([
      {
          $match: match
      },
      {
        $skip: start,
      },
      {
        $limit: limit,
      },
      {
          $lookup: {
              from: 'user_roles',
              localField: "_id",
              foreignField: "userId",
              as: 'roles'
          }
      },
      {
          $lookup: {
              from: 'useradminroles',
              localField: "roles.roleId",
              foreignField: "roleId",
              as: 'roles'
          }
      }
  ]);
    let totalUser = UserAdmin.countDocuments();
    let [data, total] = await Promise.all([listUser, totalUser]);
    return baseResponse.success(res, 200, 'Thành công', data, {total});
  } catch (error) {
    logger.error(error);
    return baseResponse.error(res);
  }
};

const updateUser = async (req, res, next) => {
  const {userId, fullName, newPassword} = req.body;
  const errors = validationResult(req);
  if(!errors.isEmpty()){
      return defaultResponse(res, 422, 'Vui lòng nhập đủ thông tin', null, errors.array());
  }
  try{
      if(userId !== req.user.id){
          if(!hasPermission([PERMISSION_CODE.MANAGER], req.roles)){
              return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này.');
          }
      }
      let user = await UserAdmin.findById(userId);
      if(!user){
          return baseResponse.error(res, 422, 'User không tồn tại.');
      }
      if(newPassword){
        const passwordHash = await bcrypt.hashSync(newPassword, SALT_ROUND);
        user.password = passwordHash;
    }
      user.fullName = fullName;
      await user.save();
      let usersQuery = UserAdmin.aggregate([
          {
              $match: {
                  _id: user._id
              }
          },
          {
              $lookup: {
                  from: 'user_roles',
                  localField: "_id",
                  foreignField: "userId",
                  as: 'roles'
              }
          },
          {
            $lookup: {
              from: 'useradminroles',
              localField: "roles.roleId",
              foreignField: "roleId",
              as: 'roles'
            }
          }
      ]);
      const [newUser] = await Promise.all([usersQuery]);
      return baseResponse.success(res, 200, 'Thành công', newUser[0]);
  }catch (e) {
      return baseResponse.error(res);
  }
};  

const deleteUser = async (req, res, next) => {
  const {userId} = req.body;
  try{
      if(!hasPermission([PERMISSION_CODE.MANAGER], req.roles)){
        return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này.');
      }
      if(userId === req.user.id){
          return baseResponse.error(res, 422, 'Bạn không thể xoá chính bạn.');
      }
      let user = await UserAdmin.findById(userId);
      if(!user){
          return baseResponse.error(res, 422, 'User không tồn tại.');
      }
      if(user.username === 'root') {
        return baseResponse.error(res, 422, 'Không thể xóa tài khoản này');
      }
      await user.delete();
      return baseResponse.success(res, 200, 'Thành công', {
          data: user
      });
  }catch(e){
      return baseResponse.error(res);
  }
}

const updateUserRoles = async (req, res, next) => {
  const {} = req.params;
  const {userId, roleId} = req.body;
  try{
      let user = await UserAdmin.findById(userId);
      if(!user){
          return baseResponse.error(res, 422, 'User không tồn tại.');
      }
      if(roleId === 1) {
        let numRole = await UserRole.countDocuments({roleId: 1});
        logger.info('numrole ' + numRole);
        if(numRole >= 2) {
          return baseResponse.error(res, 422, 'Chỉ có thể có 2 Super Admin');
        }
      }
      let userRole = await UserRole.findOne({userId: userId});
      userRole.roleId = roleId;
      await userRole.save();
      let usersQuery = UserAdmin.aggregate([
        {
            $match: {
                _id: user._id
            }
        },
        {
            $lookup: {
                from: 'user_roles',
                localField: "_id",
                foreignField: "userId",
                as: 'roles'
            }
        },
        {
          $lookup: {
            from: 'useradminroles',
            localField: "roles.roleId",
            foreignField: "roleId",
            as: 'roles'
          }
        }
    ]);
    const [newUser] = await Promise.all([usersQuery]);
    return baseResponse.success(res, 200, 'Thành công', newUser[0]);
  }catch(e){
      return baseResponse.error(res);
  }
}

module.exports = {
  adminLogin,
  adminLogout,
  createAdmin,
  getUser,
  createPermission,
  createRole,
  getListRoles,
  getPermissions,
  updateRole,
  deleteRole,
  changePassword,
  getListUserAdmin,
  updateUser,
  deleteUser,
  updateUserRoles
}