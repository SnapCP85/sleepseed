import { useState } from "react";

// ─── Genre system (from SleepSeedStyleLab.jsx) ──────────────────────────────
const MODES = [
  { id:"master",      label:"Master",      icon:"⭐", color:"#D97706", bg:"rgba(217,119,6,0.1)",    border:"rgba(217,119,6,0.25)",    desc:"Core SleepSeed voice — foundation for all genres" },
  { id:"comedy",      label:"Comedy",      icon:"😄", color:"#EAB308", bg:"rgba(234,179,8,0.08)",   border:"rgba(234,179,8,0.2)",     desc:"Silly, absurd, character-driven humour." },
  { id:"adventure",   label:"Adventure",   icon:"⚔️", color:"#F97316", bg:"rgba(249,115,22,0.08)",  border:"rgba(249,115,22,0.2)",    desc:"Real stakes, planted details, protagonist solves their own problem." },
  { id:"wonder",      label:"Wonder",      icon:"🌌", color:"#8B5CF6", bg:"rgba(139,92,246,0.08)",  border:"rgba(139,92,246,0.2)",    desc:"Strange, atmospheric, endings that stay open." },
  { id:"cosy",        label:"Cosy",        icon:"🧸", color:"#10B981", bg:"rgba(16,185,129,0.08)",  border:"rgba(16,185,129,0.2)",    desc:"Circular, sensory, small pleasures made enormous." },
  { id:"therapeutic", label:"Therapeutic", icon:"💛", color:"#0D9488", bg:"rgba(13,148,136,0.08)",  border:"rgba(13,148,136,0.2)",    desc:"Mirror → Validate → Move → Rest. Child feels directly seen." },
];

const genreMap = Object.fromEntries(MODES.map(m => [m.id, m]));

const books = [
  {
    id: 1,
    title: "The Night the Stars Listened",
    description: "A gentle story about expressing big feelings before bed.",
    emoji: "🌟",
    color: "#2D1B69",
    accent: "#C084FC",
    genres: ["therapeutic", "cosy"],
    age: "3–6",
    badge: "Therapist Approved",
    reads: "12.4k",
    featured: true,
  },
  {
    id: 2,
    title: "Milo's New Room",
    description: "Milo the bear learns to love his new home after a big move.",
    emoji: "🐻",
    color: "#1E3A5F",
    accent: "#60A5FA",
    genres: ["therapeutic", "cosy"],
    age: "2–5",
    badge: "Educator Endorsed",
    reads: "8.1k",
  },
  {
    id: 3,
    title: "Two Moons, One Family",
    description: "A warm story about love across two households.",
    emoji: "🌙",
    color: "#4A1942",
    accent: "#F472B6",
    genres: ["therapeutic"],
    age: "4–8",
    badge: "Therapist Approved",
    reads: "9.7k",
  },
  {
    id: 4,
    title: "The Worry Cloud",
    description: "Poppy learns to shrink her worry cloud one breath at a time.",
    emoji: "☁️",
    color: "#1A3A4A",
    accent: "#34D399",
    genres: ["therapeutic", "wonder"],
    age: "3–7",
    badge: "Therapist Approved",
    reads: "21.2k",
  },
  {
    id: 5,
    title: "Leo's Loud Heart",
    description: "Leo feels everything deeply — and that's a superpower.",
    emoji: "🦁",
    color: "#3B1F0A",
    accent: "#FBBF24",
    genres: ["comedy", "therapeutic"],
    age: "4–8",
    badge: "Educator Endorsed",
    reads: "6.3k",
  },
  {
    id: 6,
    title: "Goodbye, Sweet Clover",
    description: "Saying farewell to a beloved pet, with gentleness and hope.",
    emoji: "🐇",
    color: "#1A2E1A",
    accent: "#86EFAC",
    genres: ["therapeutic", "cosy"],
    age: "4–9",
    badge: "Therapist Approved",
    reads: "14.8k",
  },
  {
    id: 7,
    title: "The Doctor's Magic Wand",
    description: "A brave visit to the doctor becomes an adventure.",
    emoji: "🩺",
    color: "#1E2A4A",
    accent: "#818CF8",
    genres: ["adventure", "comedy"],
    age: "2–5",
    badge: "Educator Endorsed",
    reads: "7.9k",
  },
  {
    id: 8,
    title: "My Brother Moves Differently",
    description: "A sibling story about difference, love, and understanding.",
    emoji: "✨",
    color: "#2E1A3E",
    accent: "#E879F9",
    genres: ["therapeutic", "wonder"],
    age: "4–8",
    badge: "Therapist Approved",
    reads: "11.5k",
  },
  {
    id: 9,
    title: "Too Much Noise Inside",
    description: "When everything feels overwhelming, quiet is a superpower.",
    emoji: "🔇",
    color: "#1A1A2E",
    accent: "#7DD3FC",
    genres: ["therapeutic", "cosy"],
    age: "3–7",
    badge: "Therapist Approved",
    reads: "5.4k",
  },
];

// Genre-aware CTA text
const genreCTA = {
  master:      "Make this story yours →",
  comedy:      "Make your child the funny one →",
  adventure:   "Put your child in the adventure →",
  wonder:      "Let your child discover it →",
  cosy:        "Tuck your child into this story →",
  therapeutic: "Write this story for your child →",
};

export default function SleepSeedLibrary() {
  const [activeGenre, setActiveGenre] = useState("all");
  const [search, setSearch] = useState("");
  const [hoveredBook, setHoveredBook] = useState(null);

  const filtered = books.filter((b) => {
    const matchGenre = activeGenre === "all" || b.genres.includes(activeGenre);
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase());
    return matchGenre && matchSearch;
  });

  // Featured: one book per genre (first match), shown when no filter active
  const featuredByGenre = MODES.filter(m => m.id !== "master").map(mode => {
    const match = books.find(b => b.genres.includes(mode.id));
    return match ? { ...match, featuredGenre: mode } : null;
  }).filter(Boolean);

  const grid = activeGenre === "all" && !search
    ? filtered.filter(b => !featuredByGenre.some(f => f.id === b.id))
    : filtered;

  // Get primary genre CTA for hovered book
  const getHoverCTA = (book) => {
    const primary = book.genres[0];
    return genreCTA[primary] || genreCTA.master;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0B0B1A",
      color: "#F0EDE8",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .library-root { font-family: 'DM Sans', sans-serif; }
        .display-font { font-family: 'Lora', Georgia, serif; }

        /* Stars background */
        .stars { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; z-index: 0; }
        .star { position: absolute; border-radius: 50%; background: white; animation: twinkle 3s infinite ease-in-out; }
        @keyframes twinkle { 0%,100%{opacity:0.2; transform:scale(1);} 50%{opacity:0.9; transform:scale(1.3);} }

        .content { position: relative; z-index: 1; }

        /* Nav */
        .nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(11,11,26,0.8); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; }
        .logo { display: flex; align-items: center; gap: 10px; font-family: 'Lora', serif; font-size: 22px; font-weight: 700; color: #F0EDE8; letter-spacing: -0.3px; }
        .logo-moon { font-size: 26px; }
        .nav-links { display: flex; gap: 32px; align-items: center; }
        .nav-link { font-family: 'DM Sans', sans-serif; font-size: 14px; color: rgba(240,237,232,0.5); cursor: pointer; transition: color 0.2s; font-weight: 400; }
        .nav-link:hover { color: #F0EDE8; }
        .nav-link.active { color: #F0EDE8; }
        .nav-cta { background: linear-gradient(135deg, #7C3AED, #A855F7); color: white; padding: 9px 22px; border-radius: 50px; font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; border: none; transition: opacity 0.2s, transform 0.15s; }
        .nav-cta:hover { opacity: 0.9; transform: translateY(-1px); }

        /* Hero */
        .hero { padding: 64px 48px 0; }
        .hero-label { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: #A855F7; margin-bottom: 14px; }
        .hero-title { font-family: 'Lora', serif; font-size: 52px; font-weight: 700; line-height: 1.1; color: #F0EDE8; max-width: 540px; }
        .hero-title em { font-style: italic; color: #C084FC; }
        .hero-sub { font-family: 'DM Sans', sans-serif; font-size: 16px; color: rgba(240,237,232,0.55); margin-top: 16px; max-width: 420px; line-height: 1.65; font-weight: 300; }

        /* Search */
        .search-row { display: flex; align-items: center; gap: 12px; margin-top: 28px; }
        .search-wrap { position: relative; flex: 1; max-width: 400px; }
        .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 16px; opacity: 0.4; }
        .search-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 50px; padding: 12px 20px 12px 44px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #F0EDE8; outline: none; transition: border-color 0.2s, background 0.2s; }
        .search-input::placeholder { color: rgba(240,237,232,0.35); }
        .search-input:focus { border-color: rgba(168,85,247,0.5); background: rgba(255,255,255,0.09); }
        .count-badge { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(240,237,232,0.35); }

        /* Genre filters */
        .tags-row { display: flex; gap: 8px; padding: 32px 48px 0; flex-wrap: wrap; }
        .genre-pill { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; padding: 7px 18px; border-radius: 50px; cursor: pointer; border: 1px solid; transition: all 0.2s; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; }

        /* Featured */
        .section { padding: 40px 48px 0; }
        .section-label { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: rgba(240,237,232,0.35); margin-bottom: 20px; }
        .featured-card { display: flex; gap: 0; border-radius: 24px; overflow: hidden; border: 1px solid; cursor: pointer; transition: transform 0.25s, box-shadow 0.25s; }
        .featured-card:hover { transform: translateY(-3px); }
        .featured-art { width: 220px; min-height: 200px; display: flex; align-items: center; justify-content: center; font-size: 88px; background: rgba(0,0,0,0.2); flex-shrink: 0; }
        .featured-body { padding: 32px 36px; display: flex; flex-direction: column; justify-content: center; }
        .featured-badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 50px; padding: 5px 14px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.5px; margin-bottom: 14px; width: fit-content; }
        .featured-title { font-family: 'Lora', serif; font-size: 28px; font-weight: 700; color: #F0EDE8; line-height: 1.2; margin-bottom: 10px; }
        .featured-desc { font-family: 'DM Sans', sans-serif; font-size: 14px; color: rgba(240,237,232,0.6); line-height: 1.65; font-weight: 300; margin-bottom: 20px; }
        .featured-meta { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .meta-item { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(240,237,232,0.45); }
        .meta-item span { color: rgba(240,237,232,0.75); font-weight: 500; }
        .read-btn { margin-left: auto; color: white; border: none; padding: 11px 26px; border-radius: 50px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.2s, transform 0.15s; }
        .read-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* Grid */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; padding: 40px 48px 80px; }
        .book-card { border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); cursor: pointer; transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s; background: rgba(255,255,255,0.03); }
        .book-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.15); }
        .book-art { height: 160px; display: flex; align-items: center; justify-content: center; font-size: 68px; position: relative; }
        .book-reads { position: absolute; top: 12px; right: 14px; font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(255,255,255,0.45); background: rgba(0,0,0,0.3); padding: 4px 10px; border-radius: 50px; }
        .book-body { padding: 20px 22px 22px; }
        .book-badge { display: inline-flex; align-items: center; gap: 5px; font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 50px; margin-bottom: 10px; }
        .badge-therapist { background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.3); color: #34D399; }
        .badge-educator { background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.3); color: #60A5FA; }
        .book-title { font-family: 'Lora', serif; font-size: 17px; font-weight: 600; color: #F0EDE8; line-height: 1.3; margin-bottom: 8px; }
        .book-desc { font-family: 'DM Sans', sans-serif; font-size: 13px; color: rgba(240,237,232,0.5); line-height: 1.6; font-weight: 300; margin-bottom: 14px; }
        .book-genres { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 12px; }
        .book-genre-pill { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500; padding: 3px 10px; border-radius: 50px; display: inline-flex; align-items: center; gap: 4px; }
        .book-footer { display: flex; align-items: center; justify-content: space-between; }
        .book-age { font-family: 'DM Sans', sans-serif; font-size: 11px; color: rgba(240,237,232,0.35); white-space: nowrap; }
        .personalize-strip { margin: 12px 22px 0; padding: 10px 14px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 12px; display: flex; align-items: center; gap: 6px; opacity: 0; transition: opacity 0.2s; }

        /* Bottom CTA */
        .cta-bar { background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08)); border-top: 1px solid rgba(168,85,247,0.15); padding: 48px; text-align: center; }
        .cta-bar h3 { font-family: 'Lora', serif; font-size: 28px; font-weight: 700; color: #F0EDE8; margin-bottom: 10px; }
        .cta-bar p { font-family: 'DM Sans', sans-serif; font-size: 15px; color: rgba(240,237,232,0.5); margin-bottom: 28px; font-weight: 300; }
        .cta-btns { display: flex; gap: 14px; justify-content: center; }
        .cta-primary { background: linear-gradient(135deg, #7C3AED, #A855F7); color: white; border: none; padding: 14px 32px; border-radius: 50px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; }
        .cta-secondary { background: transparent; color: rgba(240,237,232,0.7); border: 1px solid rgba(255,255,255,0.15); padding: 14px 32px; border-radius: 50px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 400; cursor: pointer; }

        /* Featured grid */
        .featured-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(460px, 1fr)); gap: 16px; }

        @media (max-width: 768px) {
          .nav { padding: 16px 24px; }
          .hero { padding: 48px 24px 0; }
          .hero-title { font-size: 36px; }
          .tags-row { padding: 24px 24px 0; }
          .section { padding: 32px 24px 0; }
          .featured-card { flex-direction: column; }
          .featured-art { width: 100%; min-height: 160px; }
          .featured-grid { grid-template-columns: 1fr; }
          .grid { padding: 32px 24px 60px; grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* Stars */}
      <div className="stars">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="star" style={{
            width: Math.random() * 2 + 1 + "px",
            height: Math.random() * 2 + 1 + "px",
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            animationDelay: Math.random() * 3 + "s",
            animationDuration: (Math.random() * 2 + 2) + "s",
            opacity: Math.random() * 0.6 + 0.1,
          }} />
        ))}
      </div>

      <div className="content library-root">
        {/* Nav */}
        <nav className="nav">
          <div className="logo">
            <span className="logo-moon">🌙</span> SleepSeed
          </div>
          <div className="nav-links">
            <span className="nav-link active">Story Library</span>
            <span className="nav-link">How It Works</span>
            <span className="nav-link">For Therapists</span>
            <span className="nav-link">Pricing</span>
          </div>
          <button className="nav-cta">✨ Create Your Story</button>
        </nav>

        {/* Hero */}
        <div className="hero">
          <div className="hero-label">📚 Story Library</div>
          <h1 className="hero-title display-font">
            Stories that <em>heal,</em><br /> help, and delight.
          </h1>
          <p className="hero-sub">
            Expert-reviewed books for real moments — big feelings, new beginnings, and everything in between.
          </p>
          <div className="search-row">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by topic, feeling, or genre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="count-badge">{filtered.length} stories</span>
          </div>
        </div>

        {/* Genre filters */}
        <div className="tags-row">
          {/* All pill */}
          <div
            className="genre-pill"
            style={{
              background: activeGenre === "all" ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.04)",
              borderColor: activeGenre === "all" ? "#A855F7" : "rgba(255,255,255,0.12)",
              color: activeGenre === "all" ? "#E9D5FF" : "rgba(240,237,232,0.5)",
            }}
            onClick={() => setActiveGenre("all")}
          >
            All
          </div>
          {MODES.filter(m => m.id !== "master").map((mode) => {
            const isActive = activeGenre === mode.id;
            return (
              <div
                key={mode.id}
                className="genre-pill"
                style={{
                  background: isActive ? mode.bg : "rgba(255,255,255,0.04)",
                  borderColor: isActive ? mode.border : "rgba(255,255,255,0.12)",
                  color: isActive ? mode.color : "rgba(240,237,232,0.5)",
                }}
                onClick={() => setActiveGenre(mode.id)}
              >
                <span>{mode.icon}</span> {mode.label}
              </div>
            );
          })}
        </div>

        {/* Featured — one per genre */}
        {activeGenre === "all" && !search && (
          <div className="section">
            <div className="section-label">✦ Featured by genre</div>
            <div className="featured-grid">
              {featuredByGenre.map((book) => {
                const g = book.featuredGenre;
                return (
                  <div key={`feat-${book.id}-${g.id}`} className="featured-card"
                    style={{
                      background: `linear-gradient(135deg, ${book.color}, ${book.color}cc)`,
                      borderColor: g.border,
                      boxShadow: `0 8px 32px ${g.color}18`,
                    }}>
                    <div className="featured-art" style={{ background: `linear-gradient(135deg, ${book.color}dd, ${book.color})` }}>
                      {book.emoji}
                    </div>
                    <div className="featured-body">
                      <div className="featured-badge" style={{
                        background: g.bg,
                        border: `1px solid ${g.border}`,
                        color: g.color,
                      }}>
                        {g.icon} {g.label}
                      </div>
                      <div className="featured-title display-font">{book.title}</div>
                      <div className="featured-desc">{book.description}</div>
                      <div className="featured-meta">
                        <div className="meta-item">Ages <span>{book.age}</span></div>
                        <div className="meta-item"><span>{book.reads}</span> reads</div>
                        <button className="read-btn" style={{ background: `linear-gradient(135deg, ${g.color}, ${g.color}cc)` }}>
                          {genreCTA[g.id] || "Read Now →"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="section" style={{ padding: "32px 48px 0" }}>
          <div className="section-label">
            {activeGenre === "all" && !search
              ? "✦ All stories"
              : `✦ ${filtered.length} result${filtered.length !== 1 ? "s" : ""}${activeGenre !== "all" ? ` in ${genreMap[activeGenre]?.label || ""}` : ""}`}
          </div>
        </div>
        <div className="grid">
          {grid.map((book) => {
            const primaryGenre = genreMap[book.genres[0]];
            return (
              <div
                key={book.id}
                className="book-card"
                onMouseEnter={() => setHoveredBook(book.id)}
                onMouseLeave={() => setHoveredBook(null)}
                style={{
                  boxShadow: hoveredBook === book.id ? `0 16px 48px ${book.accent}22` : "none",
                }}
              >
                <div className="book-art" style={{ background: `linear-gradient(135deg, ${book.color}, ${book.color}dd)` }}>
                  {book.emoji}
                  <div className="book-reads">📖 {book.reads}</div>
                </div>
                <div className="book-body">
                  <div className={`book-badge ${book.badge === "Therapist Approved" ? "badge-therapist" : "badge-educator"}`}>
                    {book.badge === "Therapist Approved" ? "✓ Therapist Approved" : "✓ Educator Endorsed"}
                  </div>
                  <div className="book-title display-font">{book.title}</div>
                  <div className="book-desc">{book.description}</div>
                  {/* Genre pills */}
                  <div className="book-genres">
                    {book.genres.map((gId) => {
                      const g = genreMap[gId];
                      if (!g) return null;
                      return (
                        <div key={gId} className="book-genre-pill" style={{
                          background: g.bg,
                          border: `1px solid ${g.border}`,
                          color: g.color,
                        }}>
                          <span style={{ fontSize: 11 }}>{g.icon}</span> {g.label}
                        </div>
                      );
                    })}
                  </div>
                  <div className="book-footer">
                    <div className="book-age">Ages {book.age}</div>
                  </div>
                </div>
                {/* Genre-aware hover CTA */}
                <div className="personalize-strip" style={{
                  opacity: hoveredBook === book.id ? 1 : 0,
                  background: primaryGenre ? `${primaryGenre.color}12` : "rgba(168,85,247,0.08)",
                  border: `1px solid ${primaryGenre ? primaryGenre.border : "rgba(168,85,247,0.2)"}`,
                  color: primaryGenre ? primaryGenre.color : "rgba(192,132,252,0.8)",
                }}>
                  {primaryGenre?.icon || "✨"} {getHoverCTA(book)}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Bar */}
        <div className="cta-bar">
          <h3 className="display-font">Don't see the perfect story?</h3>
          <p>Create a personalized bedtime story in 60 seconds — tailored to your child's name, interests, and needs.</p>
          <div className="cta-btns">
            <button className="cta-primary">✨ Create a Personalized Story</button>
            <button className="cta-secondary">Submit a Story Idea</button>
          </div>
        </div>
      </div>
    </div>
  );
}
