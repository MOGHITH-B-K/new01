(function (global) {
  "use strict";

  const CONFIG_KEY = "moghith_sb_credentials_v1";

  const DEFAULTS = {
    profile: {
      name: "Moghith B K",
      role: "Full-Stack Developer",
      tagline: "I build clean, reliable web experiences — from idea to deployment.",
      bio: "I'm a developer who enjoys turning problems into simple, elegant solutions.\n\nWhen I'm not coding, I'm learning a new tool, exploring cloud technology, or improving something I built last week.",
      photo: "",
      skills: ["Python", "React", "Node.js", "PostgreSQL", "Tailwind CSS", "Git", "REST APIs", "Cloud & DevOps"],
      location: "Chennai, India",
      resume: "",
      effects: { typewriter: true, slides: true, blink: true }
    },
    experience: [],
    education: [],
    projects: [],
    certificates: [],
    contact: {
      email: "moghith@example.com",
      phone: "+91 98765 43210",
      location: "Chennai, India",
      sub: "Have a project in mind, a question, or just want to say hello? My inbox is always open.",
      socials: [{ label: "GitHub", url: "https://github.com" }, { label: "LinkedIn", url: "https://linkedin.com" }]
    }
  };

  let DB = JSON.parse(JSON.stringify(DEFAULTS));
  let supabaseClient = null;
  let realtimeChannel = null;

  function esc(str) {
    return (str || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function uid() {
    return "id_" + Math.random().toString(36).slice(2, 11);
  }

  function getCredentials() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.url && parsed.key) return { url: parsed.url, key: parsed.key };
      }
    } catch (e) {}
    const cfg = global.PORTFOLIO_CONFIG || {};
    return { url: cfg.supabaseUrl || "", key: cfg.supabaseKey || "" };
  }

  function saveCredentials(url, key) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, key }));
  }

  function initSupabase() {
    const creds = getCredentials();
    if (creds.url && creds.key && global.supabase) {
      supabaseClient = global.supabase.createClient(creds.url, creds.key);
      return true;
    }
    supabaseClient = null;
    return false;
  }

  function isConnected() {
    return !!supabaseClient;
  }

  function getDB() {
    return DB;
  }

  function setDB(next) {
    DB = next;
  }

  function mapProfile(row) {
    if (!row) return { ...DEFAULTS.profile };
    const skills = Array.isArray(row.skills)
      ? row.skills
      : String(row.skills || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    return {
      ...DEFAULTS.profile,
      ...row,
      skills: skills,
      effects: row.effects || DEFAULTS.profile.effects
    };
  }

  function mapExperience(row) {
    return {
      ...row,
      desc: row.desc || row.description || "",
      description: row.description || row.desc || ""
    };
  }

  function mapEducation(row) {
    return {
      ...row,
      desc: row.desc || row.description || "",
      description: row.description || row.desc || ""
    };
  }

  function mapProject(row) {
    const tech = Array.isArray(row.tech)
      ? row.tech
      : String(row.tech || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    return {
      ...row,
      tech: tech,
      desc: row.desc || row.description || "",
      description: row.description || row.desc || ""
    };
  }

  function mapCertificate(row) {
    return {
      ...row,
      credId: row.credId || row.cred_id || "",
      cred_id: row.cred_id || row.credId || ""
    };
  }

  function mapContact(row) {
    const socials = Array.isArray(row.socials) ? row.socials : DEFAULTS.contact.socials;
    return { ...DEFAULTS.contact, ...row, socials: socials };
  }

  function applyPayload(data) {
    if (!data) return;
    if (data.profile) DB.profile = mapProfile(data.profile);
    if (Array.isArray(data.experience)) DB.experience = data.experience.map(mapExperience);
    if (Array.isArray(data.education)) DB.education = data.education.map(mapEducation);
    if (Array.isArray(data.projects)) DB.projects = data.projects.map(mapProject);
    if (Array.isArray(data.certificates)) DB.certificates = data.certificates.map(mapCertificate);
    if (data.contact) DB.contact = mapContact(data.contact);
  }

  function lastError(results) {
    for (let i = 0; i < results.length; i++) {
      const err = results[i] && results[i].error;
      if (err && err.code !== "PGRST116") return err;
    }
    return null;
  }

  async function loadFromSupabase() {
    if (!initSupabase()) {
      try {
        const res = await fetch("/api/portfolio");
        if (res.ok) {
          applyPayload(await res.json());
          return { ok: true, via: "api" };
        }
      } catch (e) {}
      return { ok: false, error: "Supabase is not configured." };
    }

    const results = await Promise.all([
      supabaseClient.from("profiles").select("*").eq("id", "main").maybeSingle(),
      supabaseClient.from("experiences").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("educations").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("projects").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("certificates").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("contacts").select("*").eq("id", "main").maybeSingle()
    ]);

    const err = lastError(results);
    if (err) return { ok: false, error: err.message };

    applyPayload({
      profile: results[0].data,
      experience: results[1].data || [],
      education: results[2].data || [],
      projects: results[3].data || [],
      certificates: results[4].data || [],
      contact: results[5].data
    });
    return { ok: true, via: "supabase" };
  }

  function throwIfError(error) {
    if (error) throw new Error(error.message || "Database error");
  }

  function toRow(table, payload) {
    if (table === "experiences" || table === "educations" || table === "projects") {
      return {
        id: payload.id,
        role: payload.role,
        org: payload.org,
        type: payload.type,
        period: payload.period,
        location: payload.location,
        link: payload.link,
        degree: payload.degree,
        institution: payload.institution,
        grade: payload.grade,
        title: payload.title,
        description: payload.description || payload.desc || "",
        tech: payload.tech,
        repo: payload.repo,
        image: payload.image
      };
    }
    if (table === "certificates") {
      return {
        id: payload.id,
        title: payload.title,
        issuer: payload.issuer,
        date: payload.date,
        cred_id: payload.cred_id || payload.credId || "",
        link: payload.link,
        image: payload.image
      };
    }
    if (table === "profiles") {
      return {
        id: payload.id || "main",
        name: payload.name,
        role: payload.role,
        tagline: payload.tagline,
        bio: payload.bio,
        photo: payload.photo,
        skills: payload.skills,
        location: payload.location,
        resume: payload.resume,
        effects: payload.effects
      };
    }
    if (table === "contacts") {
      return {
        id: payload.id || "main",
        email: payload.email,
        phone: payload.phone,
        location: payload.location,
        sub: payload.sub,
        socials: payload.socials || []
      };
    }
    return payload;
  }

  function compactRow(row) {
    const out = {};
    Object.keys(row).forEach(function (key) {
      if (row[key] !== undefined) out[key] = row[key];
    });
    return out;
  }

  async function persist(table, payload, action) {
    if (!initSupabase()) {
      throw new Error("Supabase is not connected. Open Admin → Supabase Config.");
    }
    if (action === "delete") {
      const { error } = await supabaseClient.from(table).delete().eq("id", payload);
      throwIfError(error);
      return true;
    }
    const { error } = await supabaseClient.from(table).upsert(compactRow(toRow(table, payload)));
    throwIfError(error);
    return true;
  }

  function subscribeRealtime(onChange) {
    if (!initSupabase()) return function () {};
    if (realtimeChannel) {
      supabaseClient.removeChannel(realtimeChannel);
    }
    const tables = ["profiles", "experiences", "educations", "projects", "certificates", "contacts"];
    let channel = supabaseClient.channel("portfolio-live");
    tables.forEach(function (table) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: table },
        function () { onChange(); }
      );
    });
    realtimeChannel = channel.subscribe();
    return function () {
      if (realtimeChannel && supabaseClient) supabaseClient.removeChannel(realtimeChannel);
      realtimeChannel = null;
    };
  }

  global.PortfolioCore = {
    CONFIG_KEY: CONFIG_KEY,
    DEFAULTS: DEFAULTS,
    esc: esc,
    uid: uid,
    getCredentials: getCredentials,
    saveCredentials: saveCredentials,
    initSupabase: initSupabase,
    isConnected: isConnected,
    getDB: getDB,
    setDB: setDB,
    applyPayload: applyPayload,
    loadFromSupabase: loadFromSupabase,
    persist: persist,
    subscribeRealtime: subscribeRealtime,
    mapProfile: mapProfile,
    mapExperience: mapExperience,
    mapEducation: mapEducation,
    mapProject: mapProject,
    mapCertificate: mapCertificate
  };
})(window);
