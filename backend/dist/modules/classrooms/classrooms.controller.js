"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClassroom = exports.createClassroom = exports.getClassroomById = exports.getClassrooms = void 0;
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const getClassrooms = async (req, res, next) => {
    try {
        const classrooms = await server_1.prisma.classroom.findMany();
        res.json(classrooms);
    }
    catch (error) {
        next(error);
    }
};
exports.getClassrooms = getClassrooms;
const getClassroomById = async (req, res, next) => {
    try {
        const classroom = await server_1.prisma.classroom.findUnique({
            where: { id: req.params.id },
            include: {
                device: true,
            }
        });
        if (!classroom)
            throw new errors_1.NotFoundError('Classroom not found');
        res.json(classroom);
    }
    catch (error) {
        next(error);
    }
};
exports.getClassroomById = getClassroomById;
const createClassroom = async (req, res, next) => {
    try {
        const data = req.body;
        const existing = await server_1.prisma.classroom.findUnique({ where: { name: data.name } });
        if (existing)
            throw new errors_1.ConflictError('Classroom name already exists');
        const classroom = await server_1.prisma.classroom.create({ data });
        res.status(201).json(classroom);
    }
    catch (error) {
        next(error);
    }
};
exports.createClassroom = createClassroom;
const updateClassroom = async (req, res, next) => {
    try {
        const data = req.body;
        if (data.name) {
            const existing = await server_1.prisma.classroom.findUnique({ where: { name: data.name } });
            if (existing && existing.id !== req.params.id) {
                throw new errors_1.ConflictError('Classroom name already exists');
            }
        }
        const classroom = await server_1.prisma.classroom.update({
            where: { id: req.params.id },
            data,
        });
        res.json(classroom);
    }
    catch (error) {
        next(error);
    }
};
exports.updateClassroom = updateClassroom;
