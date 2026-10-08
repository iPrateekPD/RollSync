require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

const subjects = [
  { subject_code: 'MCA', subject_name: 'Microcontrollers and Applications (Dr. Ami Kumar Parida)' },
  { subject_code: 'DSP', subject_name: 'Digital Signal Processing (Dr. Bibhu Prasad)' },
  { subject_code: 'VLSI', subject_name: 'Digital VLSI Design (Dr. Jitendra Kumar)' },
  { subject_code: 'EMW', subject_name: 'Electromagnetic Waves (Dr. Saran Srihari Sripada Panda)' },
  { subject_code: 'FOC', subject_name: 'Fiber Optic Communications (Dr. Bandana Mallick)' },
  { subject_code: 'OB', subject_name: 'Organizational Behaviour (Mrs. Swapna Mayee Sahoo)' },
  { subject_code: 'MC LAB', subject_name: 'Microcontrollers Laboratory (Dr. Radhanath Patra)' },
  { subject_code: 'DSP LAB', subject_name: 'Digital Signal Processing Laboratory (Dr. Ranjita Rout)' },
  { subject_code: 'VLSI LAB', subject_name: 'Digital VLSI Design Laboratory (Dr. Jitendra Kumar)' },
  { subject_code: 'PROJECT', subject_name: 'Project Work' }
];

async function seedSubjects() {
  console.log('Seeding subjects to Supabase...');
  for (const sub of subjects) {
    const { error } = await supabase.from('subjects').upsert([sub], { onConflict: 'subject_code' });
    if (error) {
      console.error('Failed to insert', sub.subject_code, error);
    } else {
      console.log('Inserted:', sub.subject_code);
    }
  }
  console.log('Done seeding subjects.');
}

seedSubjects();
