"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCourse = exports.createCourse = exports.getCourseById = exports.getCourses = void 0;
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const getCourses = async (req, res, next) => {
    try {
        const courses = await server_1.prisma.course.findMany({
            include: {
                semester: { select: { name: true, number: true } },
                teacher: { select: { firstName: true, lastName: true } },
            }
        });
        res.json(courses);
    }
    catch (error) {
        next(error);
    }
};
exports.getCourses = getCourses;
const getCourseById = async (req, res, next) => {
    try {
        const course = await server_1.prisma.course.findUnique({
            where: { id: req.params.id },
            include: {
                semester: true,
                teacher: true,
                enrollments: {
                    include: { student: { select: { studentId: true, firstName: true, lastName: true } } }
                }
            }
        });
        if (!course)
            throw new errors_1.NotFoundError('Course not found');
        res.json(course);
    }
    catch (error) {
        next(error);
    }
};
exports.getCourseById = getCourseById;
const createCourse = async (req, res, next) => {
    try {
        const data = req.body;
        const existing = await server_1.prisma.course.findUnique({ where: { code: data.code } });
        if (existing)
            throw new errors_1.ConflictError('Course code already exists');
        const course = await server_1.prisma.course.create({ data });
        res.status(201).json(course);
    }
    catch (error) {
        next(error);
    }
};
exports.createCourse = createCourse;
const updateCourse = async (req, res, next) => {
    try {
        const data = req.body;
        const course = await server_1.prisma.course.update({
            where: { id: req.params.id },
            data,
        });
        res.json(course);
    }
    catch (error) {
        next(error);
    }
};
exports.updateCourse = updateCourse;
