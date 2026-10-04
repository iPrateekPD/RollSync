import axios, { AxiosInstance, AxiosError } from 'axios';
import { ERPProvider, DayWiseAttendance, SubjectWiseAttendance, SubjectGrade } from './erp.interface';
import { UnauthorizedError, AppError } from '../../utils/errors';
import * as https from 'https';

export class RealERPProvider implements ERPProvider {
  private getClient(sessionCookie: string): AxiosInstance {
    return axios.create({
      baseURL: 'https://gietuerp.in',
      timeout: 10000,
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'RollSync-Integration-Backend',
        'Accept': 'application/json, text/plain, */*'
      },
      // Allow self-signed certs if GIETU ERP has SSL issues, otherwise remove
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
  }

  private handleError(error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new UnauthorizedError('ERP_SESSION_EXPIRED');
      }
      throw new AppError(`ERP Request Failed: ${error.message}`, 'ERP_REQUEST_FAILED', error.response?.status || 500);
    }
    throw new AppError('An unexpected error occurred communicating with the ERP', 'ERP_UNKNOWN_ERROR', 500);
  }

  async authenticate(username: string, password: string): Promise<string> {
    // In a real scenario, this would POST to the GIETU login endpoint and extract the 'set-cookie' header.
    // Since the actual login URL was not provided, this is a placeholder.
    // The instructions say: "User authenticates through the normal ERP login process. Backend receives/maintains the authenticated session securely."
    // Often this means the frontend might just pass the cookie to us, or we implement the exact login here.
    try {
      const response = await axios.post('https://gietuerp.in/Account/Login', {
        username,
        password
      }, {
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });

      const cookies = response.headers['set-cookie'];
      if (!cookies || cookies.length === 0) {
        throw new UnauthorizedError('Invalid ERP credentials or failed to obtain session cookie');
      }

      return cookies.join('; ');
    } catch (error) {
      this.handleError(error);
      return '';
    }
  }

  async getDayWiseAttendance(rollNo: string, sessionCookie: string, semester: number = -1): Promise<DayWiseAttendance[]> {
    try {
      const client = this.getClient(sessionCookie);
      
      // Send as form data as requested: vintSemester=-1, vcchRollNo=<AUTHORIZED_STUDENT_ROLL_NO>
      const formData = new URLSearchParams();
      formData.append('vintSemester', semester.toString());
      formData.append('vcchRollNo', rollNo);

      const response = await client.post('/AttendanceReport/GetAttendanceByRollNo', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // We don't know the exact response format, so we make a best effort to map or return it.
      // Assumes it's an array of objects that we map to our DayWiseAttendance interface.
      const data = response.data;
      if (!Array.isArray(data)) {
        // If it's a wrapper like { data: [...] } or { d: [...] } (common in ASP.NET)
        return (data.data || data.d || []).map(this.normalizeDayWise);
      }

      return data.map(this.normalizeDayWise);
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  async getSubjectWiseAttendance(rollNo: string, sessionCookie: string): Promise<SubjectWiseAttendance[]> {
    try {
      const client = this.getClient(sessionCookie);
      const formData = new URLSearchParams();
      formData.append('vcchRollNo', rollNo);

      const response = await client.post('/StudentDashboard/GetSubjectWiseAttendance', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const data = response.data;
      const list = Array.isArray(data) ? data : (data.data || data.d || []);
      return list.map(this.normalizeSubjectWise);
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  async getAcademicDetails(studentId: string, sessionCookie: string): Promise<any> {
    try {
      const client = this.getClient(sessionCookie);
      const response = await client.get(`/Student/StudentAcademicDetails?id=${studentId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  async getSubjectWiseGrades(rollNo: string, sessionCookie: string): Promise<SubjectGrade[]> {
    try {
      const client = this.getClient(sessionCookie);
      const response = await client.get(`/Student/GetSubjectWiseGrades?rollNo=${rollNo}`); // Guessed query param
      
      const data = response.data;
      const list = Array.isArray(data) ? data : (data.data || data.d || []);
      return list.map(this.normalizeGrade);
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  // Normalization helpers
  private normalizeDayWise(item: any): DayWiseAttendance {
    return {
      date: item.date || item.Date || item.vchDate || '',
      subject: item.subject || item.SubjectName || item.vchSubject || '',
      attended: parseInt(item.attended || item.Attended || item.intAttended || '0', 10),
      held: parseInt(item.held || item.Held || item.intHeld || '0', 10),
      percentage: parseFloat(item.percentage || item.Percentage || item.decPercentage || '0')
    };
  }

  private normalizeSubjectWise(item: any): SubjectWiseAttendance {
    return {
      subjectCode: item.subjectCode || item.SubjectCode || item.vchSubjectCode || '',
      subjectName: item.subjectName || item.SubjectName || item.vchSubjectName || '',
      attended: parseInt(item.attended || item.Attended || item.intAttended || '0', 10),
      held: parseInt(item.held || item.Held || item.intHeld || '0', 10),
      percentage: parseFloat(item.percentage || item.Percentage || item.decPercentage || '0')
    };
  }

  private normalizeGrade(item: any): SubjectGrade {
    return {
      semester: parseInt(item.intSemester || item.semester || '0', 10),
      subjectCode: item.subjectCode || item.vchSubjectCode || '',
      grade: item.grade || item.vchGrade || '',
      result: item.result || item.vchResult || '',
      sgpa: item.vchSGPA || item.sgpa || ''
    };
  }
}
