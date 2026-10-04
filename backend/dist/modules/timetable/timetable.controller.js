"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTimetableEntry = exports.updateTimetableEntry = exports.createTimetableEntry = exports.getTimetable = void 0;
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const client_1 = require("@prisma/client");
const getTimetable = async (req, res, next) => {
    try {
        const userRole = req.user?.role;
        let whereClause = {};
        // If teacher, only return their timetable
        if (userRole === client_1.Role.TEACHER) {
            const teacher = await server_1.prisma.teacher.findUnique({ where: { userId: req.user?.userId } });
            if (teacher) {
                whereClause = { teacherId: teacher.id };
            }
        }
        // If student, return their section's timetable
        else if (userRole === client_1.Role.STUDENT) {
            const student = await server_1.prisma.student.findUnique({ where: { userId: req.user?.userId } });
            if (student) {
                whereClause = { sectionId: student.sectionId };
            }
        }
        const timetable = await server_1.prisma.timetableEntry.findMany({
            where: whereClause,
            include: {
                course: { select: { name: true, code: true } },
                teacher: { select: { firstName: true, lastName: true } },
                classroom: { select: { name: true } },
                section: { select: { name: true } }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
        res.json(timetable);
    }
    catch (error) {
        next(error);
    }
};
exports.getTimetable = getTimetable;
const createTimetableEntry = async (req, res, next) => {
    try {
        const data = req.body;
        // Check for classroom conflicts (same room, same day, overlapping time)
        const classroomConflict = await server_1.prisma.timetableEntry.findFirst({
            where: {
                classroomId: data.classroomId,
                dayOfWeek: data.dayOfWeek,
                OR: [
                    {
                        startTime: { lte: data.startTime },
                        endTime: { gt: data.startTime }
                    },
                    {
                        startTime: { lt: data.endTime },
                        endTime: { gte: data.endTime }
                    },
                    {
                        startTime: { gte: data.startTime },
                        endTime: { lte: data.endTime }
                    }
                ]
            }
        });
        if (classroomConflict) {
            throw new errors_1.ConflictError('Classroom is already booked for this time slot');
        }
        // Check for teacher conflicts (same teacher, same day, overlapping time)
        const teacherConflict = await server_1.prisma.timetableEntry.findFirst({
            where: {
                teacherId: data.teacherId,
                dayOfWeek: data.dayOfWeek,
                OR: [
                    { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
                    { startTime: { lt: data.endTime }, endTime: { gte: data.endTime } },
                    { startTime: { gte: data.startTime }, endTime: { lte: data.endTime } }
                ]
            }
        });
        if (teacherConflict) {
            throw new errors_1.ConflictError('Teacher is already assigned to another class during this time slot');
        }
        const entry = await server_1.prisma.timetableEntry.create({ data });
        res.status(201).json(entry);
    }
    catch (error) {
        next(error);
    }
};
exports.createTimetableEntry = createTimetableEntry;
const updateTimetableEntry = async (req, res, next) => {
    try {
        // Basic update, assuming frontend checked conflicts or we add conflict checks here too
        const entry = await server_1.prisma.timetableEntry.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(entry);
    }
    catch (error) {
        next(error);
    }
};
exports.updateTimetableEntry = updateTimetableEntry;
const deleteTimetableEntry = async (req, res, next) => {
    try {
        await server_1.prisma.timetableEntry.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTimetableEntry = deleteTimetableEntry;
