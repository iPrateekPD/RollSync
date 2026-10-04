"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProgram = exports.createProgram = exports.getProgramById = exports.getPrograms = void 0;
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const getPrograms = async (req, res, next) => {
    try {
        const programs = await server_1.prisma.program.findMany({
            include: { department: { select: { name: true } } }
        });
        res.json(programs);
    }
    catch (error) {
        next(error);
    }
};
exports.getPrograms = getPrograms;
const getProgramById = async (req, res, next) => {
    try {
        const program = await server_1.prisma.program.findUnique({
            where: { id: req.params.id },
            include: { department: true }
        });
        if (!program)
            throw new errors_1.NotFoundError('Program not found');
        res.json(program);
    }
    catch (error) {
        next(error);
    }
};
exports.getProgramById = getProgramById;
const createProgram = async (req, res, next) => {
    try {
        const existing = await server_1.prisma.program.findUnique({ where: { code: req.body.code } });
        if (existing)
            throw new errors_1.ConflictError('Program code already exists');
        const program = await server_1.prisma.program.create({ data: req.body });
        res.status(201).json(program);
    }
    catch (error) {
        next(error);
    }
};
exports.createProgram = createProgram;
const updateProgram = async (req, res, next) => {
    try {
        const program = await server_1.prisma.program.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(program);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProgram = updateProgram;
