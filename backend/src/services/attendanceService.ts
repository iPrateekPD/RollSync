import { supabase } from '../supabase';
import { emitAttendanceUpdate } from '../socket';

export class AttendanceService {
  /**
   * Resolves the UID to a student, checks active session, and logs attendance.
   */
  static async processRfidTap(uid: string, deviceClassroom: string, deviceIdStr: string, eventTimestamp: string) {
    try {
      // 1. RFID -> rfid_cards -> students
      const { data: rfidData, error: rfidError } = await supabase
        .from('rfid_cards')
        .select(`
          id,
          student_id,
          active,
          students (id, name)
        `)
        .eq('uid', uid)
        .eq('active', true)
        .single();

      if (rfidError || !rfidData || !rfidData.students) {
        console.warn(`[RFID] UNKNOWN CARD UID: ${uid}`);
        return;
      }

      const studentId = rfidData.student_id;
      const student = Array.isArray(rfidData.students) ? rfidData.students[0] : rfidData.students;
      const studentName = (student as any)?.name || 'Unknown Student';
      
      console.log(`[RFID] UID: ${uid} | Student: ${studentName}`);

      // 2. Active Session Detection
      const now = new Date().toISOString();
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('classroom', deviceClassroom)
        .eq('active', true)
        .lte('start_time', now)
        .gte('end_time', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError || !sessionData) {
        console.log(`[SESSION] No active session for ${deviceClassroom}`);
        return;
      }

      const sessionId = sessionData.id;
      console.log(`[SESSION] Active session found (ID: ${sessionId})`);

      // 3. Resolve Device ID (UUID)
      let deviceUuid = null;
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_id', deviceIdStr)
        .single();

      if (!deviceError && deviceData) {
        deviceUuid = deviceData.id;
      }

      // 4. Duplicate Prevention
      const { data: duplicateData, error: duplicateError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('student_id', studentId)
        .eq('session_id', sessionId)
        .single();

      if (duplicateData) {
        console.log(`[ATTENDANCE] DUPLICATE (Student: ${studentName})`);
        return;
      }

      // 5. Insert Attendance Record
      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert({
          student_id: studentId,
          session_id: sessionId,
          device_id: deviceUuid,
          timestamp: eventTimestamp,
          status: 'present',
          source: 'rfid'
        });

      if (insertError) {
        console.error(`[ATTENDANCE] Error saving attendance:`, insertError.message);
      } else {
        console.log(`[ATTENDANCE] PRESENT`);
        console.log(`[ATTENDANCE] Saved successfully`);
        
        // Phase 4: Emit WebSocket Event to Dashboard
        emitAttendanceUpdate({
          studentId,
          studentName,
          status: 'present',
          timestamp: eventTimestamp,
          classroom: deviceClassroom
        });
      }
    } catch (error) {
      console.error(`[ATTENDANCE] Exception processing RFID tap:`, error);
    }
  }

  static async updateDeviceStatus(deviceIdStr: string, status: string = 'online') {
    try {
      const { data, error } = await supabase
        .from('devices')
        .update({ status, last_seen: new Date().toISOString() })
        .eq('device_id', deviceIdStr);

      if (error) {
        console.error(`[DEVICE] Failed to update status for ${deviceIdStr}:`, error.message);
      }
    } catch (error) {
      console.error(`[DEVICE] Exception updating device status:`, error);
    }
  }
}
