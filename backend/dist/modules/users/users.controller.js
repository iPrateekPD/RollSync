"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const getUsers = async (req, res, next) => {
    try {
        const users = await server_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json(users);
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res, next) => {
    try {
        const user = await server_1.prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user)
            throw new errors_1.NotFoundError('User not found');
        res.json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res, next) => {
    try {
        const { email, password, role } = req.body;
        const existing = await server_1.prisma.user.findUnique({ where: { email } });
        if (existing)
            throw new errors_1.ConflictError('Email already in use');
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await server_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role || 'STUDENT',
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        res.status(201).json(user);
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const deleteUser = async (req, res, next) => {
    try {
        // In a real system, you might soft delete or check for dependencies before deleting
        await server_1.prisma.user.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
