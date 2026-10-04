"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSection = exports.createSection = exports.getSections = exports.updateSemester = exports.createSemester = exports.getSemesters = exports.updateAcademicYear = exports.createAcademicYear = exports.getAcademicYears = void 0;
const server_1 = require("../../server");
// ACADEMIC YEAR
const getAcademicYears = async (req, res, next) => {
    try {
        const years = await server_1.prisma.academicYear.findMany({ include: { semesters: true } });
        res.json(years);
    }
    catch (error) {
        next(error);
    }
};
exports.getAcademicYears = getAcademicYears;
const createAcademicYear = async (req, res, next) => {
    try {
        const year = await server_1.prisma.academicYear.create({ data: req.body });
        res.status(201).json(year);
    }
    catch (error) {
        next(error);
    }
};
exports.createAcademicYear = createAcademicYear;
const updateAcademicYear = async (req, res, next) => {
    try {
        const year = await server_1.prisma.academicYear.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(year);
    }
    catch (error) {
        next(error);
    }
};
exports.updateAcademicYear = updateAcademicYear;
// SEMESTER
const getSemesters = async (req, res, next) => {
    try {
        const semesters = await server_1.prisma.semester.findMany({ include: { academicYear: true } });
        res.json(semesters);
    }
    catch (error) {
        next(error);
    }
};
exports.getSemesters = getSemesters;
const createSemester = async (req, res, next) => {
    try {
        const semester = await server_1.prisma.semester.create({ data: req.body });
        res.status(201).json(semester);
    }
    catch (error) {
        next(error);
    }
};
exports.createSemester = createSemester;
const updateSemester = async (req, res, next) => {
    try {
        const semester = await server_1.prisma.semester.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(semester);
    }
    catch (error) {
        next(error);
    }
};
exports.updateSemester = updateSemester;
// SECTION
const getSections = async (req, res, next) => {
    try {
        const sections = await server_1.prisma.section.findMany();
        res.json(sections);
    }
    catch (error) {
        next(error);
    }
};
exports.getSections = getSections;
const createSection = async (req, res, next) => {
    try {
        const section = await server_1.prisma.section.create({ data: req.body });
        res.status(201).json(section);
    }
    catch (error) {
        next(error);
    }
};
exports.createSection = createSection;
const updateSection = async (req, res, next) => {
    try {
        const section = await server_1.prisma.section.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(section);
    }
    catch (error) {
        next(error);
    }
};
exports.updateSection = updateSection;
