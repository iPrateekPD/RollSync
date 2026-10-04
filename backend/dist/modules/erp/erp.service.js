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
exports.erpService = exports.ERPService = void 0;
const erp_mock_provider_1 = require("./erp.mock.provider");
const erp_real_provider_1 = require("./erp.real.provider");
const server_1 = require("../../server");
const errors_1 = require("../../utils/errors");
const crypto = __importStar(require("crypto"));
class ERPService {
    provider;
    constructor() {
        const isMock = process.env.ERP_PROVIDER === 'mock';
        this.provider = isMock ? new erp_mock_provider_1.MockERPProvider() : new erp_real_provider_1.RealERPProvider();
    }
    // Very basic symmetric encryption for cookie at rest in DB
    encrypt(text) {
        const key = process.env.ERP_SECRET_KEY || 'default_secret_key_32_bytes_long';
        // Ensure key is 32 bytes for aes-256-cbc
        const validKey = crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(validKey), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }
    decrypt(text) {
        if (!text)
            return '';
        try {
            const key = process.env.ERP_SECRET_KEY || 'default_secret_key_32_bytes_long';
            const validKey = crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32);
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(validKey), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        }
        catch (error) {
            return '';
        }
    }
    async storeSessionCookie(studentId, sessionCookie) {
        const encryptedCookie = this.encrypt(sessionCookie);
        await server_1.prisma.student.update({
            where: { id: studentId },
            data: { erpSessionCookie: encryptedCookie }
        });
    }
    async getSessionCookie(studentId) {
        const student = await server_1.prisma.student.findUnique({ where: { id: studentId } });
        if (!student || !student.erpSessionCookie) {
            throw new errors_1.UnauthorizedError('ERP_SESSION_MISSING');
        }
        const cookie = this.decrypt(student.erpSessionCookie);
        if (!cookie) {
            throw new errors_1.UnauthorizedError('ERP_SESSION_INVALID');
        }
        return cookie;
    }
    async authenticate(username, password) {
        return this.provider.authenticate(username, password);
    }
    async getDayWiseAttendance(studentId, rollNo) {
        const sessionCookie = await this.getSessionCookie(studentId);
        return this.provider.getDayWiseAttendance(rollNo, sessionCookie, -1);
    }
    async getSubjectWiseAttendance(studentId, rollNo) {
        const sessionCookie = await this.getSessionCookie(studentId);
        return this.provider.getSubjectWiseAttendance(rollNo, sessionCookie);
    }
    async getAcademicDetails(studentId, rollNo) {
        const sessionCookie = await this.getSessionCookie(studentId);
        // Academic details endpoint requires ID, which might be different from RollNo, assuming RollNo for now
        return this.provider.getAcademicDetails(rollNo, sessionCookie);
    }
    async getSubjectWiseGrades(studentId, rollNo) {
        const sessionCookie = await this.getSessionCookie(studentId);
        return this.provider.getSubjectWiseGrades(rollNo, sessionCookie);
    }
}
exports.ERPService = ERPService;
exports.erpService = new ERPService();
