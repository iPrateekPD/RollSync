-- Demo-specific RFID events are separate from legacy attendance_sessions.
ALTER TABLE public.demo_class_sessions
  ADD COLUMN IF NOT EXISTS subject_id uuid NULL
  REFERENCES public.subjects(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.demo_class_rfid_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.demo_class_sessions(id) ON DELETE CASCADE,
  uid text NOT NULL,
  student_id uuid NULL REFERENCES public.students(id) ON DELETE SET NULL,
  student_name_snapshot text NULL,
  classroom text NULL,
  event_timestamp timestamptz NOT NULL,
  mqtt_topic text NULL,
  raw_payload jsonb NULL,
  processing_status text NOT NULL DEFAULT 'pending',
  review_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_class_rfid_events_session_student_idx
  ON public.demo_class_rfid_events(session_id, student_id);
CREATE INDEX IF NOT EXISTS demo_class_rfid_events_uid_idx
  ON public.demo_class_rfid_events(uid);
CREATE INDEX IF NOT EXISTS demo_class_rfid_events_timestamp_idx
  ON public.demo_class_rfid_events(event_timestamp);

ALTER TABLE public.demo_class_rfid_events ENABLE ROW LEVEL SECURITY;
