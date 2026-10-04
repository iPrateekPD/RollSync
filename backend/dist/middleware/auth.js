"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new errors_1.UnauthorizedError('Missing or invalid token'));
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        next(new errors_1.UnauthorizedError('Invalid or expired token'));
    }
};
exports.authenticate = authenticate;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError());
        }
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError(`Requires one of roles: ${roles.join(', ')}`));
        }
        next();
    };
};
exports.requireRole = requireRole;
