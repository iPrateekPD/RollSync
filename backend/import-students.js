require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function main() {
  console.log("Starting import script using Supabase JS Client...");
  const csvPath = path.join(__dirname, 'ECE Students.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      name: cols[0]?.trim(),
      roll_no: cols[1]?.trim(),
      ug_no: cols[2]?.trim(),
      section: cols[3]?.trim()
    };
  });

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  let secACount = 0;
  let secBCount = 0;
  
  const validRows = [];
  
  // Validation
  for (const row of rows) {
    if (row.name && row.roll_no && row.ug_no && (row.section === 'SEC A' || row.section === 'SEC B')) {
      validRows.push(row);
      if (row.section === 'SEC A') secACount++;
      if (row.section === 'SEC B') secBCount++;
    } else {
      errors++;
    }
  }

  for (const row of validRows) {
    try {
      const { data: existingStudent, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('roll_number', row.roll_no)
        .single();
        
      if (existingStudent) {
        const { error: updateError } = await supabase
          .from('students')
          .update({
            name: row.name,
            ug_no: row.ug_no,
            section: row.section
          })
          .eq('roll_number', row.roll_no);
          
        if (updateError) throw updateError;
        updated++;
      } else {
        const { error: insertError } = await supabase
          .from('students')
          .insert({
            roll_number: row.roll_no,
            ug_no: row.ug_no,
            name: row.name,
            section: row.section,
            department: 'ECE',
            email: `${row.roll_no.toLowerCase()}@giet.edu`
          });
          
        if (insertError) throw insertError;
        imported++;
      }
    } catch (err) {
      console.error(`Error processing ${row.roll_no}:`, err.message || err);
      errors++;
    }
  }

  console.log(`\nStudent Import`);
  console.log(`--------------`);
  console.log(`CSV records: ${rows.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}\n`);
  console.log(`Sections: SEC A: ${secACount}, SEC B: ${secBCount}\n`);
}

main().catch(console.error);
