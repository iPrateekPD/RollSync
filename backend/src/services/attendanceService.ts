import { supabase } from '../supabase';
import { emitAttendanceUpdate } from '../socket';

export class AttendanceService {
  /**
   * Resolves the UID to a student, checks active session, and logs attendance.
   */
  static async processRfidTap(uid: string, deviceClassroom: string, deviceIdStr: string, eventTimestamp: string, topic?: string, payloadStr?: string) {
    try {
      // 1. Resolve Device ID (UUID)
      let deviceUuid = null;
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('id')
        .eq('device_id', deviceIdStr)
        .single();

      if (!deviceError && deviceData) {
        deviceUuid = deviceData.id;
      }

      // 2. RFID -> rfid_cards -> students
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
        .maybeSingle();

      let studentId = null;
      let studentName = 'Unknown Student';
      let processingStatus = 'pending';
      let reviewReason = null;

      if (rfidError || !rfidData || !rfidData.students) {
        console.warn(`[RFID] UNKNOWN CARD UID: ${uid}`);
        processingStatus = 'unmatched';
        reviewReason = 'Unknown RFID card';
      } else {
        studentId = rfidData.student_id;
        const student = Array.isArray(rfidData.students) ? rfidData.students[0] : rfidData.students;
        studentName = (student as any)?.name || 'Unknown Student';
        console.log(`[RFID] UID: ${uid} | Student: ${studentName}`);
      }

      // 3. Active Session Detection
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
        .maybeSingle();

      let sessionId = null;
      if (sessionError || !sessionData) {
        console.log(`[SESSION] No active session for ${deviceClassroom}`);
        if (processingStatus !== 'unmatched') {
           processingStatus = 'error';
           reviewReason = 'No active session found';
        }
      } else {
        sessionId = sessionData.id;
        console.log(`[SESSION] Active session found (ID: ${sessionId})`);
        if (processingStatus === 'pending') {
           processingStatus = 'matched';
        }
      }

      // Parse payload for raw_payload storage
      let rawPayload = null;
      try {
        if (payloadStr) rawPayload = JSON.parse(payloadStr);
      } catch (e) {}

      // 4. Save to rfid_events
      const { error: rfidEventError } = await supabase
        .from('rfid_events')
        .insert({
           device_id: deviceUuid,
           uid: uid,
           student_id: studentId,
           student_name_snapshot: studentName !== 'Unknown Student' ? studentName : null,
           classroom: deviceClassroom,
           event_timestamp: eventTimestamp,
           server_timestamp: new Date().toISOString(),
           mqtt_topic: topic || null,
           raw_payload: rawPayload,
           session_id: sessionId,
           processing_status: processingStatus,
           review_reason: reviewReason
        });
        
      if (rfidEventError) {
         console.error(`[RFID EVENT] Error saving rfid event:`, rfidEventError.message);
      }

      // 5. Update or Insert Attendance Record if matched
      if (processingStatus === 'matched' && studentId && sessionId) {
        // Check Duplicate Prevention
        const { data: duplicateData, error: duplicateError } = await supabase
          .from('attendance_records')
          .select('id, first_scan_at')
          .eq('student_id', studentId)
          .eq('session_id', sessionId)
          .maybeSingle();

        if (duplicateData) {
          console.log(`[ATTENDANCE] DUPLICATE (Student: ${studentName}) - Updating last scan time`);
          await supabase
            .from('attendance_records')
            .update({ last_scan_at: eventTimestamp, updated_at: new Date().toISOString() })
            .eq('id', duplicateData.id);
          return;
        }

        // Insert Attendance Record
        const { error: insertError } = await supabase
          .from('attendance_records')
          .insert({
            student_id: studentId,
            session_id: sessionId,
            device_id: deviceUuid,
            timestamp: eventTimestamp,
            first_scan_at: eventTimestamp,
            last_scan_at: eventTimestamp,
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
