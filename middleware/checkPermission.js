const {baseResponse} = require('../utils/helper');

const hasPermission = (permission = [], roles = []) => {    
    let hasPermission = false;
    permission.map((per) => {
        if(roles.includes(per)) {
            hasPermission = true;
            return false;
        }
    });
    return hasPermission;
}

const can = (permission = []) => {
    return function (req, res, next) {
        if(!hasPermission(permission, req.roles)){
            return baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này');
        }
        next();
    }
};

module.exports = {
    can,
    hasPermission
};
