"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
            },
        });
    }
    if (err instanceof zod_1.ZodError) {
        return res.status(422).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid input data',
                details: err.issues,
            },
        });
    }
    console.error('Unhandled Error:', err);
    return res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
        },
    });
};
exports.errorHandler = errorHandler;
