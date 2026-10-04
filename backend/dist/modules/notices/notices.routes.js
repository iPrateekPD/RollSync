"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const NoticesController = __importStar(require("./notices.controller"));
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const notices_schema_1 = require("./notices.schema");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Everyone can view their notices
router.get('/', NoticesController.getNotices);
router.get('/:id', NoticesController.getNoticeById);
// Only Admins can manage notices
router.use((0, auth_1.requireRole)([client_1.Role.ADMIN]));
router.post('/', (0, validate_1.validate)(notices_schema_1.createNoticeSchema), NoticesController.createNotice);
router.patch('/:id', (0, validate_1.validate)(notices_schema_1.updateNoticeSchema), NoticesController.updateNotice);
router.delete('/:id', NoticesController.deleteNotice);
exports.default = router;
