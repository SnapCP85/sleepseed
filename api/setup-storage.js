import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return res.status(500).json({ error: 'Missing Supabase credentials' });

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const results = [];

  // 1. Check if 'photos' bucket exists
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) return res.status(500).json({ error: 'Failed to list buckets', details: listErr.message });

  const photosBucket = buckets.find(b => b.name === 'photos');

  if (!photosBucket) {
    // Create the bucket as public
    const { error: createErr } = await supabase.storage.createBucket('photos', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/m4a'],
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    });
    if (createErr) {
      results.push({ step: 'create_bucket', error: createErr.message });
    } else {
      results.push({ step: 'create_bucket', success: true });
    }
  } else {
    results.push({ step: 'bucket_exists', public: photosBucket.public, id: photosBucket.id });
    // Update to public if not already
    if (!photosBucket.public) {
      const { error: updateErr } = await supabase.storage.updateBucket('photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/m4a'],
        fileSizeLimit: 10 * 1024 * 1024,
      });
      results.push({ step: 'update_bucket_public', error: updateErr?.message, success: !updateErr });
    }
  }

  // 2. Set up RLS policies for the bucket
  // Allow authenticated users to upload to their own folder
  const policies = [
    {
      name: 'Users can upload their own files',
      sql: `CREATE POLICY IF NOT EXISTS "Users can upload their own files" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);`,
    },
    {
      name: 'Users can update their own files',
      sql: `CREATE POLICY IF NOT EXISTS "Users can update their own files" ON storage.objects
            FOR UPDATE TO authenticated
            USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);`,
    },
    {
      name: 'Public read access for photos',
      sql: `CREATE POLICY IF NOT EXISTS "Public read access for photos" ON storage.objects
            FOR SELECT TO public
            USING (bucket_id = 'photos');`,
    },
  ];

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (error) {
        // Try raw SQL via postgres
        const { error: rawErr } = await supabase.from('_exec').select('*').limit(0);
        results.push({ step: policy.name, note: 'RPC not available, policy may need manual creation', error: error.message });
      } else {
        results.push({ step: policy.name, success: true });
      }
    } catch(e) {
      results.push({ step: policy.name, error: e.message });
    }
  }

  // 3. Test upload
  try {
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    const testPath = '_test/upload_test.txt';
    const { error: testUpErr } = await supabase.storage.from('photos').upload(testPath, testBlob, { upsert: true });
    if (testUpErr) {
      results.push({ step: 'test_upload', error: testUpErr.message });
    } else {
      results.push({ step: 'test_upload', success: true });
      // Clean up test file
      await supabase.storage.from('photos').remove([testPath]);
    }
  } catch(e) {
    results.push({ step: 'test_upload', error: e.message });
  }

  return res.status(200).json({ results, buckets: buckets.map(b => ({ name: b.name, public: b.public })) });
}
