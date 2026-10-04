import { ERPProvider, DayWiseAttendance, SubjectWiseAttendance, SubjectGrade } from './erp.interface';
import { MockERPProvider } from './erp.mock.provider';
import { RealERPProvider } from './erp.real.provider';
import { prisma } from '../../config/prisma';
import { UnauthorizedError } from '../../utils/errors';
import * as crypto from 'crypto';

export class ERPService {
  private provider: ERPProvider;

  constructor() {
    const isMock = process.env.ERP_PROVIDER === 'mock';
    this.provider = isMock ? new MockERPProvider() : new RealERPProvider();
  }

  // Very basic symmetric encryption for cookie at rest in DB
  private encrypt(text: string): string {
    const key = process.env.ERP_SECRET_KEY || 'default_secret_key_32_bytes_long';
    // Ensure key is 32 bytes for aes-256-cbc
    const validKey = crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(validKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(text: string): string {
    if (!text) return '';
    try {
      const key = process.env.ERP_SECRET_KEY || 'default_secret_key_32_bytes_long';
      const validKey = crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32);
      const textParts = text.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(validKey), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (error) {
      return '';
    }
  }

  async storeSessionCookie(studentId: string, sessionCookie: string): Promise<void> {
    const encryptedCookie = this.encrypt(sessionCookie);
    await prisma.student.update({
      where: { id: studentId },
      data: { erpSessionCookie: encryptedCookie }
    });
  }

  async getSessionCookie(studentId: string): Promise<string> {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student || !student.erpSessionCookie) {
      throw new UnauthorizedError('ERP_SESSION_MISSING');
    }
    const cookie = this.decrypt(student.erpSessionCookie);
    if (!cookie) {
      throw new UnauthorizedError('ERP_SESSION_INVALID');
    }
    return cookie;
  }

  async authenticate(username: string, password: string): Promise<string> {
    return this.provider.authenticate(username, password);
  }

  async getDayWiseAttendance(studentId: string, rollNo: string): Promise<DayWiseAttendance[]> {
    const sessionCookie = await this.getSessionCookie(studentId);
    return this.provider.getDayWiseAttendance(rollNo, sessionCookie, -1);
  }

  async getSubjectWiseAttendance(studentId: string, rollNo: string): Promise<SubjectWiseAttendance[]> {
    const sessionCookie = await this.getSessionCookie(studentId);
    return this.provider.getSubjectWiseAttendance(rollNo, sessionCookie);
  }

  async getAcademicDetails(studentId: string, rollNo: string): Promise<any> {
    const sessionCookie = await this.getSessionCookie(studentId);
    // Academic details endpoint requires ID, which might be different from RollNo, assuming RollNo for now
    return this.provider.getAcademicDetails(rollNo, sessionCookie);
  }

  async getSubjectWiseGrades(studentId: string, rollNo: string): Promise<SubjectGrade[]> {
    const sessionCookie = await this.getSessionCookie(studentId);
    return this.provider.getSubjectWiseGrades(rollNo, sessionCookie);
  }
}

export const erpService = new ERPService();
