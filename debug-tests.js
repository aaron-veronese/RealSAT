const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read creds from file
const creds = fs.readFileSync('supabase/creds.env', 'utf8');
const url = creds.match(/SUPABASE_URL=(.*)/)[1];
const key = creds.match(/SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function test() {
  // Test 1: Get all unique test IDs
  const { data: questions, error } = await supabase
    .from('questions')
    .select('test_id')
    .order('test_id', { ascending: true })
    .limit(10000);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const uniqueTestIds = [...new Set(questions.map(q => q.test_id))];
  console.log('Total unique test IDs:', uniqueTestIds.length);
  console.log('First 20 test IDs:', uniqueTestIds.slice(0, 20));
  console.log('Last 20 test IDs:', uniqueTestIds.slice(-20));
  
  // Test 2: Check test_attempts
  const { data: attempts, error: attemptsError } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', 'test-user-1');
  
  if (attemptsError) {
    console.error('Attempts Error:', attemptsError);
    return;
  }
  
  console.log('\nTotal test attempts:', attempts.length);
  console.log('Completed tests:', attempts.filter(a => a.test_status === 'COMPLETE').map(a => a.test_id));
  
  // Calculate practice tests
  const completedTestIds = new Set(attempts.filter(a => a.test_status === 'COMPLETE').map(t => t.test_id));
  const practiceTestIds = uniqueTestIds.filter(id => !completedTestIds.has(id));
  console.log('\nPractice tests count:', practiceTestIds.length);
  console.log('Should show tests:', practiceTestIds.slice(0, 10));
}

test();
