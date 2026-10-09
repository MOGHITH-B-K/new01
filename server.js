const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Supabase Configuration
// Keep the publishable client configuration available when the app is hosted
// without environment variables. Never put a service-role key here.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://totucsypcgydlnuaogby.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_vFaCeWQWCy5OYfz5FBGIgw_PdAhgwiE';

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Helper to check Supabase initialization
function getSupabase(req, res) {
  const url = req.headers['x-supabase-url'] || SUPABASE_URL;
  const key = req.headers['x-supabase-key'] || SUPABASE_ANON_KEY;

  if (url && key) {
    return createClient(url, key);
  }
  if (supabase) {
    return supabase;
  }
  return null;
}

// Health & Status Endpoint
app.get('/api/health', (req, res) => {
  const client = getSupabase(req, res);
  res.json({
    status: 'ok',
    supabaseConnected: !!client,
    message: client ? 'Backend & Supabase client ready' : 'Supabase credentials missing'
  });
});

// GET Entire Portfolio Data
app.get('/api/portfolio', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) {
    return res.status(400).json({ error: 'Supabase URL and Anon Key are required.' });
  }

  try {
    const [
      { data: profileData, error: profileErr },
      { data: expData, error: expErr },
      { data: eduData, error: eduErr },
      { data: projData, error: projErr },
      { data: certData, error: certErr },
      { data: contactData, error: contactErr }
    ] = await Promise.all([
      sb.from('profiles').select('*').single(),
      sb.from('experiences').select('*').order('created_at', { ascending: false }),
      sb.from('educations').select('*').order('created_at', { ascending: false }),
      sb.from('projects').select('*').order('created_at', { ascending: false }),
      sb.from('certificates').select('*').order('created_at', { ascending: false }),
      sb.from('contacts').select('*').single()
    ]);

    if (profileErr && profileErr.code !== 'PGRST116') console.error('Profile error:', profileErr);

    res.json({
      profile: profileData || {},
      experience: (expData || []).map(x => ({ ...x, desc: x.desc || x.description || "" })),
      education: (eduData || []).map(x => ({ ...x, desc: x.desc || x.description || "" })),
      projects: (projData || []).map(p => ({
        ...p,
        desc: p.desc || p.description || "",
        tech: Array.isArray(p.tech) ? p.tech : (p.tech ? String(p.tech).split(',') : [])
      })),
      certificates: (certData || []).map(c => ({ ...c, credId: c.credId || c.cred_id || "" })),
      contact: contactData || { socials: [] }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save / Update Profile
app.put('/api/profile', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) return res.status(400).json({ error: 'Supabase credentials missing' });

  const { name, role, tagline, bio, photo, skills, location, resume, effects } = req.body;
  const payload = {
    id: 'main',
    name,
    role,
    tagline,
    bio,
    photo,
    skills: Array.isArray(skills) ? skills : String(skills || '').split(',').map(s => s.trim()).filter(Boolean),
    location,
    resume,
    effects,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await sb.from('profiles').upsert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

// Projects CRUD
app.post('/api/projects', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) return res.status(400).json({ error: 'Supabase credentials missing' });

  const proj = req.body;
  const { data, error } = await sb.from('projects').upsert(proj).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.delete('/api/projects/:id', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) return res.status(400).json({ error: 'Supabase credentials missing' });

  const { error } = await sb.from('projects').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Experiences CRUD
app.post('/api/experiences', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) return res.status(400).json({ error: 'Supabase credentials missing' });

  const exp = req.body;
  const { data, error } = await sb.from('experiences').upsert(exp).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.delete('/api/experiences/:id', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) return res.status(400).json({ error: 'Supabase credentials missing' });

  const { error } = await sb.from('experiences').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Educations CRUD
app.post('/api/educations', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) return res.status(400).json({ error: 'Supabase credentials missing' });

  const edu = req.body;
  const { data, error } = await sb.from('educations').upsert(edu).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.delete('/api/educations/:id', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) return res.status(400).json({ error: 'Supabase credentials missing' });

  const { error } = await sb.from('educations').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Certificates CRUD
app.post('/api/certificates', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) return res.status(400).json({ error: 'Supabase credentials missing' });

  const cert = req.body;
  const { data, error } = await sb.from('certificates').upsert(cert).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.delete('/api/certificates/:id', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) return res.status(400).json({ error: 'Supabase credentials missing' });

  const { error } = await sb.from('certificates').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Save Contact
app.put('/api/contact', async (req, res) => {
  const sb = getSupabase(req, res);
  if (!sb) return res.status(400).json({ error: 'Supabase credentials missing' });

  const { email, phone, location, sub, socials } = req.body;
  const payload = {
    id: 'main',
    email,
    phone,
    location,
    sub,
    socials,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await sb.from('contacts').upsert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

// Serve standalone admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Fallback route to serve main site
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code !== 'EADDRINUSE') {
      console.error('Unable to start server:', error);
      process.exitCode = 1;
      return;
    }

    if (process.env.PORT) {
      console.error(`Port ${port} is already in use. Set PORT to an available port and restart the server.`);
      process.exitCode = 1;
      return;
    }

    const fallbackPort = port + 1;
    console.warn(`Port ${port} is already in use. Retrying on port ${fallbackPort}.`);
    startServer(fallbackPort);
  });
}

// Vercel imports this file as a serverless function. Only listen when run directly,
// so deployments do not try to bind a second process to a fixed port.
if (require.main === module) {
  startServer(PORT);
}

module.exports = app;
