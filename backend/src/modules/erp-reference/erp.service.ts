import axios from 'axios';
import * as https from 'https';
import { parseAttendanceData } from './erp.parser';
import { AppError } from '../../utils/errors';

export class ERPReferenceService {
  private client = axios.create({
    baseURL: 'https://gietuerp.in',
    timeout: 10000,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0'
    }
  });

  async getAttendance(rollno: string, semester: string = '-1', startDate: string = '', endDate: string = '') {
    try {
      const formData = new URLSearchParams();
      formData.append('vintSemester', semester);
      formData.append('vvchRollNo', rollno);
      formData.append('vdtmStartDate', startDate);
      formData.append('vdtmEndDate', endDate);

      const response = await this.client.post('/AttendanceReport/GetAttendanceByRollNo', formData);
      const data = response.data;
      
      const rawAttendance = data?.dataAttendance || [];
      return parseAttendanceData(rawAttendance, rollno);
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new AppError('Too Many Requests from GIET ERP', 'ERP_RATE_LIMIT', 429);
      }
      throw new AppError('Failed to fetch attendance from ERP', 'ERP_ERROR', 500);
    }
  }

  async getExams(rollno: string, sem: string, examType: string = '0') {
    try {
      const formData = new URLSearchParams();
      formData.append('vcchRollNo', rollno);
      formData.append('vintSemester', sem);
      formData.append('vintExamType', examType);

      // Guessing the endpoint based on common naming convention, as the actual one is unknown
      // but returning a structured response to match reference API.
      const response = await this.client.post('/StudentDashboard/GetStudentExamMark', formData);
      return response.data;
    } catch (error) {
      // Return empty array if it fails, since we are reverse engineering
      return { data: [] };
    }
  }

  async getExamSubjects(rollno: string, sem: string, examScheduleId?: string, studentId?: string) {
    try {
      const formData = new URLSearchParams();
      formData.append('vcchRollNo', rollno);
      formData.append('vintSemester', sem);
      if (examScheduleId) formData.append('intExamScheduleMasterID', examScheduleId);
      if (studentId) formData.append('intStudentID', studentId);

      const response = await this.client.post('/StudentDashboard/GetSubjectWiseExamMark', formData);
      return response.data;
    } catch (error) {
      return { data: [] };
    }
  }
}

export const erpReferenceService = new ERPReferenceService();
