"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const server_1 = require("../../server");
const client_1 = require("@prisma/client");
class AttendanceService {
    /**
     * Process an RFID tap event from a classroom device
     */
    static async processRfidEvent(classroomId, rfidUid, timestamp) {
        // 1. Find the active class session in this classroom
        const activeSession = await server_1.prisma.classSession.findFirst({
            where: {
                classroomId,
                status: client_1.SessionStatus.ACTIVE,
            },
        });
        if (!activeSession) {
            console.log(`No active session in classroom ${classroomId} for RFID tap ${rfidUid}`);
            return;
        }
        // 2. Find the student with this RFID card
        const card = await server_1.prisma.rfidCard.findUnique({
            where: { uid: rfidUid },
            include: { student: true },
        });
        if (!card || !card.isActive) {
            console.log(`Unknown or inactive RFID card: ${rfidUid}`);
            return;
        }
        // 3. Ensure the student is enrolled in the course for this session
        const enrollment = await server_1.prisma.courseEnrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId: activeSession.courseId,
                    studentId: card.studentId,
                },
            },
        });
        if (!enrollment) {
            console.log(`Student ${card.student.studentId} is not enrolled in course ${activeSession.courseId}`);
            return;
        }
        // 4. Find or create the AttendanceSession for this student
        let attendanceSession = await server_1.prisma.attendanceSession.findUnique({
            where: {
                classSessionId_studentId: {
                    classSessionId: activeSession.id,
                    studentId: card.studentId,
                },
            },
        });
        if (!attendanceSession) {
            attendanceSession = await server_1.prisma.attendanceSession.create({
                data: {
                    classSessionId: activeSession.id,
                    studentId: card.studentId,
                    state: client_1.AttendanceState.CHECKED_IN,
                },
            });
        }
        else {
            // If already tracking, a secondary tap could mean "Checkout" or "Re-entry",
            // depending on state. For a simple ERP, a second tap might do nothing if BLE is used for checkout,
            // or we can toggle it. For now, we just ensure state goes to CHECKED_IN.
            if (attendanceSession.state === client_1.AttendanceState.IDLE) {
                await server_1.prisma.attendanceSession.update({
                    where: { id: attendanceSession.id },
                    data: { state: client_1.AttendanceState.CHECKED_IN },
                });
            }
        }
        // 5. Record the raw RFID event
        await server_1.prisma.rfidEvent.create({
            data: {
                eventId: `${rfidUid}-${timestamp.getTime()}`,
                attendanceSessionId: attendanceSession.id,
                uid: rfidUid,
                timestamp,
            },
        });
        console.log(`RFID Check-in recorded for student ${card.student.studentId}`);
    }
    /**
     * Process a BLE observation event
     */
    static async processBleObservation(classroomId, bleToken, rssi, timestamp) {
        // 1. Find the active class session
        const activeSession = await server_1.prisma.classSession.findFirst({
            where: {
                classroomId,
                status: client_1.SessionStatus.ACTIVE,
            },
        });
        if (!activeSession)
            return;
        // 2. Find student by BLE token
        const identity = await server_1.prisma.bleIdentity.findUnique({
            where: { token: bleToken },
        });
        if (!identity || !identity.isActive)
            return;
        // 3. Find the AttendanceSession (Student must have checked in via RFID first to be considered 'MONITORING', 
        // or we can automatically check them in via BLE if policy allows. 
        // Let's assume strict mode: they must be checked in via RFID or we create a session in UNVERIFIED state).
        let attendanceSession = await server_1.prisma.attendanceSession.findUnique({
            where: {
                classSessionId_studentId: {
                    classSessionId: activeSession.id,
                    studentId: identity.studentId,
                },
            },
        });
        if (!attendanceSession) {
            // Create session in unverified/idle state if no RFID tap occurred yet
            attendanceSession = await server_1.prisma.attendanceSession.create({
                data: {
                    classSessionId: activeSession.id,
                    studentId: identity.studentId,
                    state: client_1.AttendanceState.IDLE, // Has not officially checked in
                },
            });
        }
        // Record the BLE observation
        await server_1.prisma.bleObservation.create({
            data: {
                eventId: `${bleToken}-${timestamp.getTime()}`,
                attendanceSessionId: attendanceSession.id,
                token: bleToken,
                rssi,
                timestamp,
            },
        });
        // Simple heuristic: if RSSI is strong enough and they are CHECKED_IN, move to MONITORING
        // If they were MONITORING and RSSI is weak for a long time, we might accumulate dwellTime.
        // For now, just update state if they were checked in.
        if (attendanceSession.state === client_1.AttendanceState.CHECKED_IN && rssi >= activeSession.rssiEnter) {
            await server_1.prisma.attendanceSession.update({
                where: { id: attendanceSession.id },
                data: { state: client_1.AttendanceState.MONITORING },
            });
        }
    }
    /**
     * Finalize attendance for a completed class session
     */
    static async finalizeClassSession(classSessionId) {
        const session = await server_1.prisma.classSession.findUnique({
            where: { id: classSessionId },
            include: {
                attendanceSessions: {
                    include: {
                        bleObservations: {
                            orderBy: { timestamp: 'asc' }
                        }
                    }
                }
            }
        });
        if (!session)
            throw new Error('Session not found');
        for (const attSession of session.attendanceSessions) {
            // Calculate continuous dwell time
            let calculatedDwellTime = 0;
            let lastObservation = null;
            for (const obs of attSession.bleObservations) {
                if (obs.rssi >= session.rssiExit) { // Only count if within acceptable range
                    if (lastObservation) {
                        const timeDiffSeconds = (obs.timestamp.getTime() - lastObservation.getTime()) / 1000;
                        if (timeDiffSeconds < session.gracePeriod) {
                            calculatedDwellTime += timeDiffSeconds;
                        }
                    }
                    lastObservation = obs.timestamp;
                }
                else {
                    lastObservation = null; // Signal lost or too weak
                }
            }
            // Final decision
            let finalStatus = client_1.ResultStatus.ABSENT;
            // If dwell time exceeds requirement OR they have a valid CHECKED_IN/MONITORING state
            // For MVP, if they just checked in, they might be marked PRESENT, but strict ERP requires dwell time.
            if (calculatedDwellTime >= session.requiredDwell) {
                finalStatus = client_1.ResultStatus.PRESENT;
            }
            else if (attSession.state === client_1.AttendanceState.MONITORING || attSession.state === client_1.AttendanceState.CHECKED_IN) {
                // Fallback if BLE failed but RFID was tapped. Maybe mark as unverified?
                // Let's mark present for MVP, or we can use the strict rule.
                // Assuming strict rule:
                finalStatus = client_1.ResultStatus.ABSENT;
            }
            // Update AttendanceResult
            await server_1.prisma.attendanceResult.upsert({
                where: { attendanceSessionId: attSession.id },
                create: {
                    attendanceSessionId: attSession.id,
                    studentId: attSession.studentId,
                    status: finalStatus,
                    reason: `Dwell time: ${calculatedDwellTime}s / ${session.requiredDwell}s`,
                },
                update: {
                    status: finalStatus,
                    reason: `Dwell time: ${calculatedDwellTime}s / ${session.requiredDwell}s`,
                }
            });
            await server_1.prisma.attendanceSession.update({
                where: { id: attSession.id },
                data: {
                    dwellTime: Math.floor(calculatedDwellTime),
                    state: client_1.AttendanceState.CLOSED
                }
            });
        }
    }
}
exports.AttendanceService = AttendanceService;
