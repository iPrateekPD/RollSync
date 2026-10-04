"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotice = exports.updateNotice = exports.createNotice = exports.getNoticeById = exports.getNotices = void 0;
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const getNotices = async (req, res, next) => {
    try {
        const userRole = req.user?.role;
        // Only show notices intended for this role
        const notices = await server_1.prisma.notice.findMany({
            where: {
                audience: { has: userRole },
                publishDate: { lte: new Date() },
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gt: new Date() } }
                ]
            },
            orderBy: [
                { priority: 'desc' },
                { publishDate: 'desc' }
            ]
        });
        res.json(notices);
    }
    catch (error) {
        next(error);
    }
};
exports.getNotices = getNotices;
const getNoticeById = async (req, res, next) => {
    try {
        const notice = await server_1.prisma.notice.findUnique({
            where: { id: req.params.id }
        });
        if (!notice)
            throw new errors_1.NotFoundError('Notice not found');
        // Check audience
        if (!notice.audience.includes(req.user?.role)) {
            throw new errors_1.NotFoundError('Notice not found'); // hide existence
        }
        res.json(notice);
    }
    catch (error) {
        next(error);
    }
};
exports.getNoticeById = getNoticeById;
const createNotice = async (req, res, next) => {
    try {
        const notice = await server_1.prisma.notice.create({ data: req.body });
        res.status(201).json(notice);
    }
    catch (error) {
        next(error);
    }
};
exports.createNotice = createNotice;
const updateNotice = async (req, res, next) => {
    try {
        const notice = await server_1.prisma.notice.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(notice);
    }
    catch (error) {
        next(error);
    }
};
exports.updateNotice = updateNotice;
const deleteNotice = async (req, res, next) => {
    try {
        await server_1.prisma.notice.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNotice = deleteNotice;
