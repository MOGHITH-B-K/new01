-- ============================================================
-- SUPABASE DATABASE SCHEMA & SEED DATA FOR PORTFOLIO
-- Execute this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT 'main',
    name TEXT NOT NULL,
    role TEXT,
    tagline TEXT,
    bio TEXT,
    photo TEXT,
    skills TEXT[],
    location TEXT,
    resume TEXT,
    effects JSONB DEFAULT '{"typewriter": true, "slides": true, "blink": true}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Experiences Table
CREATE TABLE IF NOT EXISTS experiences (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    org TEXT,
    type TEXT,
    period TEXT,
    location TEXT,
    link TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Educations Table
CREATE TABLE IF NOT EXISTS educations (
    id TEXT PRIMARY KEY,
    degree TEXT NOT NULL,
    institution TEXT,
    period TEXT,
    grade TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    tech TEXT[],
    link TEXT,
    repo TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    issuer TEXT,
    date TEXT,
    cred_id TEXT,
    link TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY DEFAULT 'main',
    email TEXT,
    phone TEXT,
    location TEXT,
    sub TEXT,
    socials JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY WITH PUBLIC READ/WRITE POLICIES
-- (Portfolio CMS; tighten later with Supabase Auth if needed)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEED INITIAL PORTFOLIO DATA FOR MOGHITH B K
-- ============================================================

INSERT INTO profiles (id, name, role, tagline, bio, photo, skills, location, resume, effects)
VALUES (
    'main',
    'Moghith B K',
    'Full-Stack Developer',
    'I build clean, reliable web experiences — from idea to deployment.',
    'I''m a developer who enjoys turning problems into simple, elegant solutions.

When I''m not coding, I''m learning a new tool, exploring cloud technology, or improving something I built last week.',
    '',
    ARRAY['Python', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Git', 'REST APIs', 'Cloud & DevOps'],
    'Chennai, India',
    '',
    '{"typewriter": true, "slides": true, "blink": true}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    tagline = EXCLUDED.tagline,
    bio = EXCLUDED.bio,
    skills = EXCLUDED.skills,
    location = EXCLUDED.location;

INSERT INTO contacts (id, email, phone, location, sub, socials)
VALUES (
    'main',
    'moghith@example.com',
    '+91 98765 43210',
    'Chennai, India',
    'Have a project in mind, a question, or just want to say hello? My inbox is always open.',
    '[{"label": "GitHub", "url": "https://github.com"}, {"label": "LinkedIn", "url": "https://linkedin.com"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO experiences (id, role, org, type, period, location, link, description)
VALUES (
    'exp1',
    'Web Development Intern',
    'Tech Solutions Inc.',
    'Internship',
    'Jun 2025 — Aug 2025',
    'Remote',
    '',
    'Built responsive UI components, integrated RESTful APIs, and improved page speed scores.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO educations (id, degree, institution, period, grade, description)
VALUES (
    'edu1',
    'B.Tech in Computer Science and Engineering',
    'College of Engineering',
    '2022 — 2026',
    'CGPA 8.5',
    'Focus on web technologies, database systems, and software engineering principles.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, title, description, tech, link, repo, image)
VALUES (
    'p1',
    'Portfolio & Admin Platform',
    'A single-page application with a complete built-in content management system backed by Supabase.',
    ARRAY['HTML5', 'CSS3', 'JavaScript', 'Supabase', 'Node.js'],
    '',
    'https://github.com',
    ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO certificates (id, title, issuer, date, cred_id, link, image)
VALUES (
    'c1',
    'Full-Stack Web Development',
    'Coursera',
    'May 2024',
    'ABC-12345',
    'https://coursera.org/verify',
    ''
)
ON CONFLICT (id) DO NOTHING;
