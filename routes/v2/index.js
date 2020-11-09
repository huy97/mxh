'use strict';
const express = require('express');
const router = express.Router();
const UserAdminController  = require('../../controllers/admin/UserAdminController');
const AuthenticateAdmin = require('../../middleware/AuthenicateAdmin');
const VersionController = require('../../controllers/admin/VersionController');
const UserController = require('../../controllers/user/UserController');
const PostController = require('../../controllers/post/PostController');

router.post('/admin/login', [], UserAdminController.adminLogin);

router.post('/admin/user/create', [], UserAdminController.createAdmin);
router.post('/admin/permission/create', [], UserAdminController.createPermission);
router.get('/admin/get-list-permissions', [], UserAdminController.getPermissions);
router.post('/admin/role/create', [], UserAdminController.createRole);
//Authenticated here
router.use(AuthenticateAdmin);
router.post('/admin/logout', [], UserAdminController.adminLogout);
router.get('/admin/post/get', [], PostController.getListByAdmin);
router.put('/admin/role/update', [], UserAdminController.updateRole);
router.get('/admin/get-user-info', [], UserAdminController.getUser);
router.get('/admin/get-list-roles', [], UserAdminController.getListRoles);
//end user
router.get('/admin/get-list-end-user', [], UserController.getListUser)
router.put('/admin/user/toogle-lock', [], UserController.toogleLock)
//version
router.post('/admin/version/create', [], VersionController.createVersion);
router.get('/admin/version/get', [], VersionController.getVersion);
router.post('/admin/version/delete', [], VersionController.deleteVersion);
router.put('/admin/version/edit', [], VersionController.updateVersion);
//post
router.put('/admin/post/toggle', [], PostController.togglePost);

module.exports = router;