export interface DayWiseAttendance {
  date: string;
  subject: string;
  attended: number;
  held: number;
  percentage: number;
}

export interface SubjectWiseAttendance {
  subjectCode: string;
  subjectName: string;
  attended: number;
  held: number;
  percentage: number;
}

export interface SubjectGrade {
  semester: number;
  subjectCode: string;
  grade: string;
  result: string;
  sgpa: string;
}

export interface ERPProvider {
  /**
   * Authenticates with the ERP and returns the session cookie/token string
   */
  authenticate(username: string, password: string): Promise<string>;
  
  getDayWiseAttendance(rollNo: string, sessionCookie: string, semester?: number): Promise<DayWiseAttendance[]>;
  
  getSubjectWiseAttendance(rollNo: string, sessionCookie: string): Promise<SubjectWiseAttendance[]>;
  
  getAcademicDetails(studentId: string, sessionCookie: string): Promise<any>;
  
  getSubjectWiseGrades(rollNo: string, sessionCookie: string): Promise<SubjectGrade[]>;
}
