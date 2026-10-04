"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const server_1 = require("../../server");
const jwt_1 = require("../../utils/jwt");
const errors_1 = require("../../utils/errors");
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await server_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const tokens = (0, jwt_1.generateTokens)({ userId: user.id, role: user.role });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            ...tokens,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        // Verify user still exists and hasn't been deactivated
        const user = await server_1.prisma.user.findUnique({
            where: { id: payload.userId },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('User no longer exists');
        }
        const tokens = (0, jwt_1.generateTokens)({ userId: user.id, role: user.role });
        res.json(tokens);
    }
    catch (error) {
        next(new errors_1.UnauthorizedError('Invalid refresh token'));
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    // Since we use stateless JWT, logout is mostly handled client-side by deleting the token.
    // We could implement a token blacklist here in the future using Redis or DB.
    res.json({ success: true, message: 'Logged out successfully' });
};
exports.logout = logout;
