import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trophy, Users, Shield, BarChart3, Plus, Trash2, Search, Save, X,
  ChevronDown, ChevronUp, Loader2, Download, Upload, Cloud, HardDrive,
  Swords, ShieldCheck, Layers, LogOut, CheckCircle, XCircle, Clock,
  UserPlus, LogIn, Eye, EyeOff, Crown, Menu, Settings,
} from 'lucide-react';
import { loadData, saveData, isRemoteEnabled, exportAllData, importAllData, hashPassword, ADMIN_USERNAME } from './storage';
import { CARD_DB, CATEGORY_LABELS, CATEGORY_LABELS_SHORT, CATEGORY_COLORS } from './cardDatabase';
import { computeAllStandings, computeTeamSummary, computeCommunityStats } from './standings';
import { LOGO_FULL } from './assets/logoData';

// ══════════════════════ WARNA & STYLE CONSTANTS ══════════════════════
const C = {
  bg:'#0d0221', bg2:'#130a2e', surface:'#1e1040', card:'#261550',
  border:'#3d2b7a', accent:'#ffcb05', accent2:'#e040fb', blue:'#3b82f6',
  green:'#22c55e', red:'#ef4444', orange:'#f97316', pink:'#ec4899',
  purple:'#a855f7', text:'#f0e6ff', dim:'#8b7cb8',
};

const card = (extra={}) => ({
  background:C.card, border:`1px solid ${C.border}`, borderRadius:12, ...extra,
});

const pill = (color, bg) => ({
  display:'inline-flex', alignItems:'center', gap:4,
  padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700,
  background: bg || color+'22', color, border:`1px solid ${color}44`,
});

const btnPrimary = {
  background:`linear-gradient(135deg,${C.accent2},${C.purple})`,
  border:'none', color:'#fff', fontWeight:700, fontSize:13,
  padding:'10px 20px', borderRadius:8, cursor:'pointer', display:'flex',
  alignItems:'center', gap:6, transition:'opacity .15s',
};
const btnSuccess = { ...btnPrimary, background:`linear-gradient(135deg,${C.green},#16a34a)` };
const btnDanger  = { ...btnPrimary, background:`linear-gradient(135deg,${C.red},#b91c1c)` };
const btnGhost   = {
  display:'flex', alignItems:'center', gap:6, background:'none',
  border:`1px solid ${C.border}`, color:C.dim, fontSize:12, fontWeight:600,
  padding:'7px 12px', borderRadius:8, cursor:'pointer',
};
const inputBase  = {
  width:'100%', background:C.surface, border:`1px solid ${C.border}`,
  borderRadius:8, color:C.text, fontSize:13, padding:'10px 12px',
  outline:'none', boxSizing:'border-box',
};

// ══════════════════════ ROOT APP ══════════════════════
export default function App() {
  const [authState, setAuthState] = useState(null); // null=loading, false=guest, object=user
  const [users, setUsers] = useState({});
  const [teams, setTeams] = useState({});
  const [groupResults, setGroupResults] = useState({});
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      const u = await loadData('sansan_users', {});
      const t = await loadData('sansan_teams', {});
      const r = await loadData('sansan_group_results', {});
      setUsers(u || {});
      setTeams(t || {});
      setGroupResults(r || {});

      // cek session lokal
      try {
        const sess = sessionStorage.getItem('sansan_session');
        if (sess) {
          const parsed = JSON.parse(sess);
          const userObj = (u || {})[parsed.username];
          if (userObj && userObj.status === 'approved') {
            setAuthState(userObj);
          } else {
            setAuthState(false);
          }
        } else {
          setAuthState(false);
        }
      } catch { setAuthState(false); }
    })();
  }, []);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(()=>setToast(''), 2500);
  };

  const saveUsers = async (newUsers) => {
    setUsers(newUsers);
    try { await saveData('sansan_users', newUsers); } catch { showToast('Gagal simpan user','error'); }
  };
  const saveTeams = async (newTeams) => {
    setTeams(newTeams);
    try { await saveData('sansan_teams', newTeams); } catch { showToast('Gagal simpan tim','error'); }
  };
  const saveGroupResults = async (gr) => {
    setGroupResults(gr);
    try { await saveData('sansan_group_results', gr); } catch { showToast('Gagal simpan hasil','error'); }
  };

  const login = (userObj) => {
    setAuthState(userObj);
    sessionStorage.setItem('sansan_session', JSON.stringify({ username: userObj.username }));
    showToast(`Selamat datang, ${userObj.displayName}! 🎉`);
  };

  const logout = () => {
    setAuthState(false);
    sessionStorage.removeItem('sansan_session');
  };

  if (authState === null) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',flexDirection:'column',gap:16}}>
        <img src={LOGO_FULL} alt="SANSAN TCG" style={{width:120,borderRadius:'50%'}} />
        <Loader2 size={24} className="animate-spin" style={{color:C.accent}} />
        <div style={{color:C.dim,fontSize:13}}>Memuat...</div>
      </div>
    );
  }

  if (!authState) {
    return (
      <>
        <AuthPage users={users} saveUsers={saveUsers} onLogin={login} showToast={showToast} />
        <ToastBar toast={toast} />
      </>
    );
  }

  return (
    <>
      <Dashboard
        currentUser={authState}
        users={users} saveUsers={saveUsers}
        teams={teams} saveTeams={saveTeams}
        groupResults={groupResults} saveGroupResults={saveGroupResults}
        showToast={showToast} logout={logout}
      />
      <ToastBar toast={toast} />
    </>
  );
}

// ══════════════════════ TOAST ══════════════════════
function ToastBar({ toast }) {
  if (!toast) return null;
  const bg = toast.type === 'error' ? C.red : toast.type === 'warn' ? C.orange : C.green;
  return (
    <div style={{
      position:'fixed', bottom:20, right:20, background:bg, color:'#fff',
      padding:'10px 18px', borderRadius:10, fontWeight:700, fontSize:13,
      zIndex:9999, boxShadow:'0 4px 20px rgba(0,0,0,.4)', maxWidth:300,
    }}>
      {toast.msg}
    </div>
  );
}

// ══════════════════════ AUTH PAGE ══════════════════════
function AuthPage({ users, saveUsers, onLogin, showToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'pending'
  const [form, setForm] = useState({ username:'', displayName:'', password:'', confirm:'' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f=>({...f,[k]:v}));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = users[form.username.toLowerCase().trim()];
      if (!u) { showToast('Username tidak ditemukan','error'); return; }
      if (u.status === 'pending') { setMode('pending'); return; }
      if (u.status === 'rejected') { showToast('Akunmu ditolak. Hubungi admin.','error'); return; }
      const hash = await hashPassword(form.password);
      if (hash !== u.passwordHash) { showToast('Password salah','error'); return; }
      onLogin(u);
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.displayName.trim() || !form.password) {
      showToast('Semua kolom wajib diisi','error'); return;
    }
    if (form.password !== form.confirm) { showToast('Password tidak cocok','error'); return; }
    if (form.password.length < 6) { showToast('Password minimal 6 karakter','error'); return; }
    const username = form.username.toLowerCase().trim();
    if (users[username]) { showToast('Username sudah dipakai','error'); return; }

    setLoading(true);
    try {
      const hash = await hashPassword(form.password);
      const isFirstAdmin = username === ADMIN_USERNAME.toLowerCase();
      const newUser = {
        username, displayName: form.displayName.trim(), passwordHash: hash,
        role: isFirstAdmin ? 'admin' : 'member',
        status: isFirstAdmin ? 'approved' : 'pending',
        createdAt: new Date().toISOString(),
      };
      const newUsers = { ...users, [username]: newUser };
      await saveUsers(newUsers);
      if (isFirstAdmin) {
        onLogin(newUser);
      } else {
        setMode('pending');
        showToast('✅ Akun dibuat! Tunggu persetujuan admin.','success');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:`radial-gradient(ellipse at top, #2d0b5a 0%, ${C.bg} 60%)`,
      padding:16,
    }}>
      {/* BANNER */}
      <div style={{textAlign:'center', marginBottom:32}}>
        <img src={LOGO_FULL} alt="SANSAN TCG" style={{
          width:120, height:120, borderRadius:'50%',
          boxShadow:`0 0 40px ${C.accent2}88`, marginBottom:16,
        }} />
        <div className="bebas" style={{fontSize:36, color:C.accent, letterSpacing:4}}>
          SANSAN TCG
        </div>
        <div style={{color:C.accent2, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:'uppercase'}}>
          🃏 Dashboard Komunitas Pokemon TCG 🃏
        </div>
      </div>

      {/* CARD */}
      <div style={{
        ...card(), padding:28, width:'100%', maxWidth:400,
        boxShadow:`0 0 60px ${C.accent2}33`,
      }}>
        {mode === 'pending' ? (
          <div style={{textAlign:'center', padding:'20px 0'}}>
            <Clock size={48} style={{color:C.orange, marginBottom:12}} />
            <div style={{fontWeight:700, fontSize:16, marginBottom:8}}>Menunggu Persetujuan 🕐</div>
            <div style={{color:C.dim, fontSize:13, lineHeight:1.6}}>
              Akunmu sudah dibuat dan sedang menunggu disetujui oleh admin. Coba login lagi setelah di-approve ya!
            </div>
            <button onClick={()=>setMode('login')} style={{...btnGhost, margin:'20px auto 0', justifyContent:'center'}}>
              ← Kembali ke Login
            </button>
          </div>
        ) : mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{fontWeight:800, fontSize:18, marginBottom:20, display:'flex', alignItems:'center', gap:8}}>
              <LogIn size={18} style={{color:C.accent2}} /> Masuk ke Dashboard
            </div>
            <Field label="Username">
              <input value={form.username} onChange={e=>set('username',e.target.value)}
                placeholder="username kamu..." style={inputBase} autoCapitalize="none" />
            </Field>
            <Field label="Password">
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)}
                  placeholder="••••••••" style={{...inputBase, paddingRight:40}} />
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{
                  position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', color:C.dim, cursor:'pointer', padding:0,
                }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </Field>
            <button type="submit" style={{...btnPrimary, width:'100%', justifyContent:'center', marginTop:8}} disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin"/> : <LogIn size={15}/>}
              {loading ? 'Loading...' : 'Login'}
            </button>
            <div style={{textAlign:'center', marginTop:16, fontSize:12, color:C.dim}}>
              Belum punya akun?{' '}
              <button type="button" onClick={()=>setMode('signup')} style={{background:'none',border:'none',color:C.accent2,cursor:'pointer',fontWeight:700,fontSize:12}}>
                Daftar di sini →
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div style={{fontWeight:800, fontSize:18, marginBottom:20, display:'flex', alignItems:'center', gap:8}}>
              <UserPlus size={18} style={{color:C.accent2}} /> Buat Akun Baru
            </div>
            <Field label="Username (tidak bisa diubah)">
              <input value={form.username} onChange={e=>set('username',e.target.value)}
                placeholder="contoh: trainer_satoshi" style={inputBase} autoCapitalize="none" />
            </Field>
            <Field label="Nama Tampil">
              <input value={form.displayName} onChange={e=>set('displayName',e.target.value)}
                placeholder="Nama kamu di komunitas" style={inputBase} />
            </Field>
            <Field label="Password (min 6 karakter)">
              <input type={showPw?'text':'password'} value={form.password} onChange={e=>set('password',e.target.value)}
                placeholder="••••••••" style={inputBase} />
            </Field>
            <Field label="Konfirmasi Password">
              <div style={{position:'relative'}}>
                <input type={showPw?'text':'password'} value={form.confirm} onChange={e=>set('confirm',e.target.value)}
                  placeholder="••••••••" style={{...inputBase, paddingRight:40}} />
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{
                  position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', color:C.dim, cursor:'pointer', padding:0,
                }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </Field>
            <div style={{...pill(C.orange), marginBottom:12, fontSize:11, padding:'6px 10px', display:'flex', alignItems:'center', gap:6}}>
              <Clock size={12}/> Akun perlu disetujui admin sebelum bisa login
            </div>
            <button type="submit" style={{...btnPrimary, width:'100%', justifyContent:'center'}} disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin"/> : <UserPlus size={15}/>}
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
            <div style={{textAlign:'center', marginTop:16, fontSize:12, color:C.dim}}>
              Sudah punya akun?{' '}
              <button type="button" onClick={()=>setMode('login')} style={{background:'none',border:'none',color:C.accent2,cursor:'pointer',fontWeight:700,fontSize:12}}>
                Login →
              </button>
            </div>
          </form>
        )}
      </div>
      <div style={{color:C.dim, fontSize:11, marginTop:20, textAlign:'center'}}>
        🌟 Komunitas Pokemon TCG Indonesia · SANSAN TCG Shop 🌟
      </div>
    </div>
  );
}

// ══════════════════════ DASHBOARD (setelah login) ══════════════════════
function Dashboard({ currentUser, users, saveUsers, teams, saveTeams, groupResults, saveGroupResults, showToast, logout }) {
  const [tab, setTab] = useState('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = currentUser.role === 'admin';

  const TABS = [
    {id:'overview', label:'Overview', icon:'🏠'},
    {id:'groups',   label:'Divisi',   icon:'🛡️'},
    {id:'teams',    label:'Tim & Deck',icon:'🃏'},
    {id:'stats',    label:'Stats',     icon:'📊'},
    ...(isAdmin ? [{id:'admin', label:'Admin', icon:'👑'}] : []),
  ];

  return (
    <div style={{minHeight:'100vh'}}>
      {/* HEADER */}
      <header style={{
        background:`linear-gradient(135deg,#2d0b5a,${C.bg2})`,
        borderBottom:`1px solid ${C.border}`,
        padding:'0 16px', position:'sticky', top:0, zIndex:200,
      }}>
        <div style={{maxWidth:1400, margin:'0 auto', display:'flex', alignItems:'center', gap:12, height:56}}>
          {/* Logo */}
          <img src={LOGO_FULL} alt="SANSAN" style={{width:38, height:38, borderRadius:'50%', flexShrink:0}} />
          <div className="bebas hide-mobile" style={{fontSize:20, color:C.accent, whiteSpace:'nowrap'}}>
            SANSAN <span style={{color:C.text}}>TCG</span>
          </div>

          {/* Desktop Nav */}
          <nav style={{display:'flex', gap:2, flex:1, overflowX:'auto'}} className="hide-mobile">
            {TABS.map(t => (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                background: tab===t.id ? 'rgba(224,64,251,.15)' : 'none',
                border:'none', color: tab===t.id ? C.accent2 : C.dim,
                fontSize:12, fontWeight:700, padding:'6px 12px', borderRadius:8,
                cursor:'pointer', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5,
                borderBottom: tab===t.id ? `2px solid ${C.accent2}` : '2px solid transparent',
              }}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </nav>

          {/* Mobile hamburger nav */}
          <div style={{display:'none', flex:1}} className="show-mobile-flex">
            <div style={{display:'flex', gap:2, overflowX:'auto', flex:1}}>
              {TABS.map(t => (
                <button key={t.id} onClick={()=>setTab(t.id)} style={{
                  background: tab===t.id ? 'rgba(224,64,251,.15)' : 'none',
                  border:'none', color: tab===t.id ? C.accent2 : C.dim,
                  fontSize:11, fontWeight:700, padding:'5px 8px', borderRadius:8,
                  cursor:'pointer', whiteSpace:'nowrap', display:'flex', flexDirection:'column',
                  alignItems:'center', gap:2, minWidth:44,
                }}>
                  <span style={{fontSize:16}}>{t.icon}</span>
                  <span style={{fontSize:9}}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right side: badge + user + logout */}
          <div style={{display:'flex', alignItems:'center', gap:8, flexShrink:0}}>
            {isRemoteEnabled
              ? <span style={{...pill(C.green), fontSize:10}}><Cloud size={10}/>Cloud</span>
              : <span style={{...pill(C.dim), fontSize:10}}><HardDrive size={10}/>Lokal</span>
            }
            <div style={{display:'flex', alignItems:'center', gap:6}}>
              {isAdmin && <Crown size={14} style={{color:C.accent}}/>}
              <span style={{fontSize:12, fontWeight:700, color:C.text}} className="hide-mobile">
                {currentUser.displayName}
              </span>
            </div>
            <button onClick={logout} title="Logout" style={{...btnGhost, padding:'6px 8px'}}>
              <LogOut size={14}/>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV - sudah di dalam header, jadi ini duplikat guard */}
      <style>{`
        @media (max-width: 640px) {
          .show-mobile-flex { display: flex !important; }
          .hide-mobile { display: none !important; }
        }
        .show-mobile-flex { display: none; }
      `}</style>

      {/* MAIN */}
      <main style={{maxWidth:1400, margin:'0 auto', padding:'16px 12px'}}>
        <div className="fade-in">
          {tab === 'overview' && <OverviewTab teams={teams} groupResults={groupResults} currentUser={currentUser} />}
          {tab === 'groups'   && <GroupsTab teams={teams} groupResults={groupResults} setGroupResults={saveGroupResults} showToast={showToast} />}
          {tab === 'teams'    && <TeamsTab teams={teams} saveTeams={saveTeams} showToast={showToast} currentUser={currentUser} />}
          {tab === 'stats'    && <StatsTab teams={teams} groupResults={groupResults} />}
          {tab === 'admin' && isAdmin && <AdminTab users={users} saveUsers={saveUsers} teams={teams} groupResults={groupResults} showToast={showToast} currentUser={currentUser} exportAllData={exportAllData} importAllData={async (data)=>{ importAllData(data); const t=await loadData?.('sansan_teams',{})||{}; }} />}
        </div>
      </main>

      <BackupBar showToast={showToast} />
    </div>
  );
}

// ══════════════════════ SHARED UI HELPERS ══════════════════════
function SectionTitle({ emoji, children }) {
  return (
    <div className="bebas" style={{fontSize:20, color:C.accent, marginBottom:14, display:'flex', alignItems:'center', gap:10}}>
      {emoji && <span style={{fontSize:20}}>{emoji}</span>}
      {children}
      <div style={{flex:1, height:1, background:C.border}}></div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{color:C.dim, padding:'40px 20px', textAlign:'center', ...card(), border:`1px dashed ${C.border}`}}>
      <div style={{fontSize:32, marginBottom:8}}>🃏</div>
      {text}
    </div>
  );
}

function StatBox({ num, label, emoji }) {
  return (
    <div style={{
      background:`linear-gradient(135deg,${C.surface},${C.card})`,
      border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', textAlign:'center',
      boxShadow:`0 4px 20px rgba(0,0,0,.3)`,
    }}>
      {emoji && <div style={{fontSize:24, marginBottom:4}}>{emoji}</div>}
      <div className="bebas" style={{fontSize:36, color:C.accent, lineHeight:1}}>{num}</div>
      <div style={{color:C.dim, fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginTop:4}}>{label}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:'block', fontSize:11, color:C.dim, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:5}}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputScore = {
  background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, color:C.text,
  fontFamily:"'Bebas Neue',sans-serif", fontSize:20, width:46, textAlign:'center', padding:4, outline:'none',
};

// ══════════════════════ OVERVIEW TAB ══════════════════════
function OverviewTab({ teams, groupResults, currentUser }) {
  const teamNames = Object.keys(teams);
  const standings = useMemo(() => computeAllStandings(teams, groupResults), [teams, groupResults]);
  const ranked = Object.values(standings).flat().sort((a,b)=> b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga));
  const totalCards = teamNames.reduce((s,t)=>s+(teams[t].deck||[]).reduce((ss,c)=>ss+(c.qty||0),0),0);
  const totalMatches = Object.keys(groupResults).length;

  return (
    <div>
      {/* HERO */}
      <div style={{
        background:`linear-gradient(135deg,#3d1470,#1a0533 60%,#0d2b5a)`,
        border:`1px solid ${C.border}`, borderRadius:16, padding:'28px 24px',
        marginBottom:20, position:'relative', overflow:'hidden',
      }}>
        <div style={{position:'absolute', top:-20, right:-20, fontSize:120, opacity:.06, userSelect:'none', lineHeight:1}}>
          🃏
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'center'}}>
          <div>
            <div style={{fontSize:12, color:C.accent2, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:6}}>
              🌟 Komunitas Pokemon TCG Indonesia
            </div>
            <div className="bebas" style={{fontSize:'clamp(28px,5vw,52px)', lineHeight:.95, color:'#fff'}}>
              SANSAN TCG<br/>
              <em style={{color:C.accent, fontStyle:'normal'}}>STANDINGS</em>
            </div>
            <div style={{color:C.dim, fontSize:12, marginTop:10}}>
              Halo, <strong style={{color:C.text}}>{currentUser.displayName}</strong>! 👋 Selamat datang di dashboard komunitas.
            </div>
          </div>
          <img src={LOGO_FULL} alt="logo" style={{
            width:'clamp(60px,12vw,100px)', height:'clamp(60px,12vw,100px)',
            borderRadius:'50%', boxShadow:`0 0 30px ${C.accent2}66`, flexShrink:0,
          }} />
        </div>
      </div>

      {/* STAT BOXES */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:20}}>
        <StatBox num={teamNames.length}    label="Tim Terdaftar"  emoji="🛡️" />
        <StatBox num={Object.keys(standings).length} label="Divisi Aktif" emoji="⚡" />
        <StatBox num={totalMatches}        label="Match Selesai"  emoji="⚔️" />
        <StatBox num={totalCards}          label="Kartu Terdaftar" emoji="🃏" />
        <StatBox num={ranked.filter(r=>r.pl>0).length} label="Tim Sudah Main" emoji="🏆" />
      </div>

      {/* KLASEMEN GABUNGAN */}
      <SectionTitle emoji="🏆">Klasemen Gabungan</SectionTitle>
      {ranked.length === 0 ? (
        <EmptyState text="Belum ada tim terdaftar. Pergi ke tab Tim & Deck untuk mulai! 🚀" />
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8}}>
          {ranked.map((r, i) => {
            const medals = ['🥇','🥈','🥉'];
            return (
              <div key={r.team} style={{
                ...card(), padding:'10px 14px',
                display:'flex', alignItems:'center', gap:10,
                background: i<3 ? `linear-gradient(135deg,${C.card},#3d1470)` : C.card,
                border: i===0 ? `1px solid ${C.accent}` : i<3 ? `1px solid ${C.accent2}44` : `1px solid ${C.border}`,
              }}>
                <div style={{fontSize:i<3?22:16, width:28, textAlign:'center', flexShrink:0}}>
                  {i<3 ? medals[i] : <span className="bebas" style={{color:C.dim}}>{i+1}</span>}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontWeight:700, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:i===0?C.accent:C.text}}>
                    {r.team}
                  </div>
                  <div style={{fontSize:10, color:C.dim, marginTop:2}}>
                    {teams[r.team]?.player || 'Belum ada pemain'} · Div {r.group} · <strong style={{color:C.accent2}}>{r.pts} pts</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════ GROUPS TAB ══════════════════════
function GroupsTab({ teams, groupResults, setGroupResults, showToast }) {
  const standings = useMemo(() => computeAllStandings(teams, groupResults), [teams, groupResults]);
  const groupIds = Object.keys(standings).sort();
  if (groupIds.length === 0) return <EmptyState text="Belum ada divisi. Tambahkan tim di tab 'Tim & Deck'!" />;
  return (
    <div>
      <SectionTitle emoji="🛡️">Standings per Divisi</SectionTitle>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14}}>
        {groupIds.map(g => (
          <GroupCard key={g} groupId={g} rows={standings[g]} groupResults={groupResults} setGroupResults={setGroupResults} showToast={showToast} />
        ))}
      </div>
    </div>
  );
}

function GroupCard({ groupId, rows, groupResults, setGroupResults, showToast }) {
  const [editing, setEditing] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const teamList = rows.map(r=>r.team);
  const pairs = [];
  for (let i=0;i<teamList.length;i++) for (let j=i+1;j<teamList.length;j++) pairs.push([teamList[i],teamList[j]]);

  const groupEmojis = {A:'🔥',B:'💧',C:'⚡',D:'🌿',E:'🔮',F:'🌑',G:'⚙️',H:'🐉',I:'✨',J:'🥊',K:'❄️',L:'🌈'};
  const played = Object.keys(groupResults).filter(k=>k.startsWith(groupId+'|')).length;

  return (
    <div style={{...card(), overflow:'hidden'}}>
      <div style={{
        background:`linear-gradient(135deg,#2d0b5a,${C.surface})`,
        padding:'10px 14px', display:'flex', alignItems:'center', gap:10,
        borderBottom:`1px solid ${C.border}`,
      }}>
        <span style={{fontSize:24}}>{groupEmojis[groupId]||'🃏'}</span>
        <div className="bebas" style={{fontSize:22, color:C.accent}}>Divisi {groupId}</div>
        <div style={{marginLeft:'auto', ...pill(C.dim), fontSize:10}}>{played}/{pairs.length} main</div>
      </div>

      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr>
            {['Tim','P','W','D','L','GF','GA','GD','Pts'].map((h,i)=>(
              <th key={h} style={{
                fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:.8,
                color:C.dim, padding:'6px 8px', textAlign:i===0?'left':'center',
                background:C.surface, borderBottom:`1px solid ${C.border}`,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>{
            const gd=r.gf-r.ga;
            return (
              <tr key={r.team} style={{background:i<2?'rgba(224,64,251,.06)':undefined}}>
                <td style={{
                  padding:'7px 8px', fontSize:11, fontWeight:600,
                  borderLeft:i<2?`3px solid ${C.accent2}`:'3px solid transparent',
                  borderBottom:`1px solid ${C.border}44`,
                }}>{r.team}</td>
                {[r.pl,r.w,r.d,r.l,r.gf,r.ga].map((v,j)=>(
                  <td key={j} style={{padding:'7px 8px',textAlign:'center',fontSize:11,borderBottom:`1px solid ${C.border}44`}}>{v}</td>
                ))}
                <td style={{padding:'7px 8px',textAlign:'center',fontSize:11,borderBottom:`1px solid ${C.border}44`,
                  color:gd>0?C.green:gd<0?C.red:undefined}}>
                  {gd>0?'+':''}{gd}
                </td>
                <td style={{padding:'7px 8px',textAlign:'center',fontSize:12,fontWeight:800,borderBottom:`1px solid ${C.border}44`,color:C.accent}}>
                  {r.pts}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{padding:'10px 12px', borderTop:`1px solid ${C.border}`}}>
        <div style={{fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1, marginBottom:6, fontWeight:700}}>
          ⚔️ Input Hasil Match
        </div>
        {pairs.map(([a,b])=>{
          const key=`${groupId}|${a}|${b}`;
          const res=groupResults[key];
          const isOpen=editing===key;
          return (
            <div key={key} style={{marginBottom:5}}>
              <div onClick={()=>{
                const ex=groupResults[key]; setScoreA(ex?ex.a:0); setScoreB(ex?ex.b:0);
                setEditing(editing===key?null:key);
              }} style={{
                display:'flex', alignItems:'center', gap:8, padding:'6px 10px',
                background:C.surface, border:`1px solid ${res?C.green+'44':C.border}`,
                borderRadius:8, cursor:'pointer', fontSize:11,
              }}>
                <span style={{flex:1, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{a}</span>
                <span className="bebas" style={{fontSize:14, color:res?C.green:C.dim, minWidth:50, textAlign:'center'}}>
                  {res?`${res.a} – ${res.b}`:'vs'}
                </span>
                <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{b}</span>
              </div>
              {isOpen && (
                <div style={{
                  display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginTop:4,
                  background:C.surface, border:`1px solid ${C.accent}`, borderRadius:8,
                }}>
                  <span style={{flex:1, fontSize:11, textAlign:'right'}}>{a}</span>
                  <input type="number" min="0" max="20" value={scoreA} onChange={e=>setScoreA(e.target.value)} style={inputScore}/>
                  <span className="bebas" style={{color:C.dim}}>–</span>
                  <input type="number" min="0" max="20" value={scoreB} onChange={e=>setScoreB(e.target.value)} style={inputScore}/>
                  <span style={{flex:1, fontSize:11}}>{b}</span>
                  <button onClick={()=>{ setGroupResults({...groupResults,[key]:{a:+scoreA,b:+scoreB}}); setEditing(null); showToast('✅ Hasil disimpan!'); }}
                    style={{...btnSuccess, padding:'6px 10px'}}><Save size={12}/></button>
                  {res && <button onClick={()=>{ const n={...groupResults}; delete n[key]; setGroupResults(n); setEditing(null); showToast('Hasil dihapus'); }}
                    style={{...btnDanger, padding:'6px 10px'}}><Trash2 size={12}/></button>}
                  <button onClick={()=>setEditing(null)} style={{...btnGhost, padding:'6px 8px'}}><X size={12}/></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════ TEAMS TAB ══════════════════════
function TeamsTab({ teams, saveTeams, showToast, currentUser }) {
  const teamNames = Object.keys(teams);
  const [selected, setSelected] = useState(teamNames[0]||null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(()=>{
    if (!selected && teamNames.length>0) setSelected(teamNames[0]);
    if (selected && !teams[selected]) setSelected(teamNames[0]||null);
  },[teams]);

  const addTeam = () => {
    const name = newName.trim();
    if (!name) { showToast('Nama tim tidak boleh kosong','error'); return; }
    if (teams[name]) { showToast('Nama tim sudah ada','error'); return; }
    saveTeams({...teams,[name]:{player:'',group:'A',deck:[],createdBy:currentUser.username}});
    setSelected(name); setShowNewForm(false); setNewName('');
    showToast('✅ Tim ditambahkan!');
  };

  return (
    <div>
      <SectionTitle emoji="🃏">Tim & Deck Komunitas</SectionTitle>
      <div style={{display:'grid', gridTemplateColumns:'min(240px,100%) 1fr', gap:14}}>
        {/* SIDEBAR */}
        <div>
          <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:10}}>
            {teamNames.map(name=>(
              <div key={name} onClick={()=>{ setSelected(name); setShowNewForm(false); }} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between', gap:6,
                ...card(), padding:'10px 12px', cursor:'pointer',
                background: selected===name ? `linear-gradient(135deg,${C.card},#3d1470)` : C.card,
                border: `1px solid ${selected===name?C.accent2:C.border}`,
              }}>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    color:selected===name?C.accent2:C.text}}>
                    🛡️ {name}
                  </div>
                  <div style={{fontSize:10, color:C.dim}}>
                    Div {teams[name].group||'A'} · {(teams[name].deck||[]).reduce((s,c)=>s+(c.qty||0),0)} kartu
                  </div>
                </div>
                {currentUser.role==='admin' && (
                  <button onClick={e=>{e.stopPropagation(); if(confirm(`Hapus tim "${name}"?`)){
                    const n={...teams}; delete n[name]; saveTeams(n); showToast('Tim dihapus');
                  }}} style={{background:'none',border:'none',color:C.dim,cursor:'pointer',flexShrink:0}}>
                    <Trash2 size={13}/>
                  </button>
                )}
              </div>
            ))}
          </div>
          {!showNewForm ? (
            <button onClick={()=>setShowNewForm(true)} style={{
              width:'100%', background:'none', border:`1px dashed ${C.border}`, color:C.dim,
              borderRadius:10, padding:'10px', cursor:'pointer', fontSize:12,
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              <Plus size={14}/> Tambah Tim Baru
            </button>
          ) : (
            <div style={{...card(), padding:12}}>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Nama tim baru..."
                onKeyDown={e=>{ if(e.key==='Enter') addTeam(); }}
                style={{...inputBase, marginBottom:10}} />
              <div style={{display:'flex', gap:6}}>
                <button onClick={addTeam} style={{...btnSuccess, flex:1, justifyContent:'center', fontSize:12, padding:'8px'}}>
                  <Save size={12}/> Simpan
                </button>
                <button onClick={()=>{setShowNewForm(false);setNewName('');}} style={{...btnGhost, flex:1, justifyContent:'center', fontSize:12, padding:'8px'}}>
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DETAIL */}
        <div>
          {selected && teams[selected]
            ? <TeamDetail name={selected} info={teams[selected]} onUpdate={info=>saveTeams({...teams,[selected]:info})} showToast={showToast} />
            : <EmptyState text="Pilih atau buat tim baru 👈" />
          }
        </div>
      </div>
    </div>
  );
}

function TeamDetail({ name, info, onUpdate, showToast }) {
  const [player, setPlayer] = useState(info.player||'');
  const [group, setGroup] = useState(info.group||'A');
  useEffect(()=>{ setPlayer(info.player||''); setGroup(info.group||'A'); },[name]);

  const save = () => { onUpdate({...info,player,group}); showToast('✅ Info tim disimpan!'); };

  const deck = info.deck||[];
  const total = deck.reduce((s,c)=>s+(c.qty||0),0);

  const addCard = (cardName, category) => {
    const idx = deck.findIndex(c=>c.name===cardName&&c.category===category);
    const newDeck = idx>=0
      ? deck.map((c,i)=>i===idx?{...c,qty:Math.min((c.qty||0)+1,4)}:c)
      : [...deck,{name:cardName,category,qty:1}];
    onUpdate({...info,deck:newDeck});
  };

  const setQty = (idx, qty) => {
    const q = Math.max(0,Math.min(4,+qty));
    onUpdate({...info, deck: q===0 ? deck.filter((_,i)=>i!==idx) : deck.map((c,i)=>i===idx?{...c,qty:q}:c)});
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{...card(),padding:16}}>
        <div className="bebas" style={{fontSize:22,color:C.accent,marginBottom:12}}>🛡️ {name}</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:10, alignItems:'end'}}>
          <Field label="Nama Pemain / Trainer">
            <input value={player} onChange={e=>setPlayer(e.target.value)} placeholder="Nama pemain..." style={inputBase} />
          </Field>
          <Field label="Divisi">
            <select value={group} onChange={e=>setGroup(e.target.value)} style={inputBase}>
              {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g=>(
                <option key={g} value={g}>Divisi {g}</option>
              ))}
            </select>
          </Field>
          <button onClick={save} style={{...btnSuccess, height:40, padding:'0 16px'}}>
            <Save size={14}/> Simpan
          </button>
        </div>
      </div>

      <div style={{...card(),padding:16}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
          <div className="bebas" style={{fontSize:18,color:C.accent}}>🃏 Deck List</div>
          <div style={{
            ...pill(total===60?C.green:total>60?C.red:C.orange),
            fontSize:12, padding:'4px 10px',
          }}>
            {total} / 60 kartu {total===60?'✅':total>60?'⚠️ Terlalu banyak!':''}
          </div>
        </div>

        {deck.length===0 ? (
          <div style={{color:C.dim,fontSize:12,padding:'16px 0',textAlign:'center'}}>
            🃏 Belum ada kartu. Tambahkan dari database di bawah!
          </div>
        ) : (
          <div style={{marginBottom:14}}>
            {Object.keys(CATEGORY_LABELS_SHORT).map(cat=>{
              const cardsInCat = deck.filter(c=>c.category===cat);
              if (!cardsInCat.length) return null;
              return (
                <div key={cat} style={{marginBottom:10}}>
                  <div style={{
                    fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1,
                    color:CATEGORY_COLORS[cat], margin:'8px 0 6px',
                    display:'flex', alignItems:'center', gap:6,
                  }}>
                    {CATEGORY_LABELS[cat]} — {cardsInCat.reduce((s,c)=>s+c.qty,0)} kartu
                  </div>
                  {cardsInCat.map(c=>{
                    const idx=deck.indexOf(c);
                    return (
                      <div key={c.name+c.category} style={{
                        display:'flex', alignItems:'center', gap:8,
                        padding:'5px 10px', background:C.surface,
                        border:`1px solid ${C.border}`, borderRadius:6, marginBottom:4,
                      }}>
                        <span style={{flex:1,fontSize:12}}>{c.name}</span>
                        <input type="number" min="0" max="4" value={c.qty} onChange={e=>setQty(idx,e.target.value)}
                          style={{...inputScore,fontSize:14,width:36,padding:2}} />
                        <button onClick={()=>onUpdate({...info,deck:deck.filter((_,i)=>i!==idx)})}
                          style={{background:'none',border:'none',color:C.dim,cursor:'pointer'}}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
        <CardPicker onAdd={addCard} />
      </div>
    </div>
  );
}

function CardPicker({ onAdd }) {
  const [cat, setCat] = useState('pokemon');
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState('');
  const [open, setOpen] = useState(false);
  const list = CARD_DB[cat].filter(c=>c.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{borderTop:`1px solid ${C.border}`, paddingTop:12}}>
      <button onClick={()=>setOpen(!open)} style={{
        display:'flex', alignItems:'center', gap:6, background:'none', border:'none',
        color:C.dim, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1,
        cursor:'pointer', padding:0,
      }}>
        {open?<ChevronUp size={13}/>:<ChevronDown size={13}/>} ➕ Tambah Kartu dari Database
      </button>
      {open && (
        <div style={{marginTop:10}}>
          <div style={{display:'flex', gap:5, flexWrap:'wrap', marginBottom:8}}>
            {Object.keys(CATEGORY_LABELS_SHORT).map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{
                background: cat===c?CATEGORY_COLORS[c]+'22':'none',
                border:`1px solid ${cat===c?CATEGORY_COLORS[c]:C.border}`,
                color: cat===c?CATEGORY_COLORS[c]:C.dim,
                fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, cursor:'pointer',
              }}>
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          <div style={{position:'relative', marginBottom:8}}>
            <Search size={13} style={{position:'absolute', left:10, top:12, color:C.dim}}/>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              placeholder={`Cari ${CATEGORY_LABELS_SHORT[cat].toLowerCase()}...`}
              style={{...inputBase, paddingLeft:30}} />
          </div>
          <div style={{maxHeight:180, overflowY:'auto', display:'flex', flexDirection:'column', gap:3, marginBottom:8}}>
            {list.length===0
              ? <div style={{color:C.dim,fontSize:11,padding:'8px 0',textAlign:'center'}}>Tidak ditemukan 🔍</div>
              : list.map(card=>(
                <div key={card} onClick={()=>onAdd(card,cat)} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
                  padding:'6px 10px', background:C.surface, border:`1px solid ${C.border}`,
                  borderRadius:6, cursor:'pointer', fontSize:12,
                }}>
                  <span>{card}</span>
                  <Plus size={13} style={{color:CATEGORY_COLORS[cat], flexShrink:0}}/>
                </div>
              ))
            }
          </div>
          <div style={{display:'flex', gap:6}}>
            <input value={custom} onChange={e=>setCustom(e.target.value)}
              placeholder="Kartu tidak ada? Tambah manual..."
              onKeyDown={e=>{ if(e.key==='Enter'&&custom.trim()){ onAdd(custom.trim(),cat); setCustom(''); }}}
              style={{...inputBase, flex:1}} />
            <button onClick={()=>{ if(custom.trim()){ onAdd(custom.trim(),cat); setCustom(''); }}}
              style={{...btnSuccess, padding:'0 12px'}}><Plus size={14}/></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════ STATS TAB ══════════════════════
function StatsTab({ teams, groupResults }) {
  const teamNames = Object.keys(teams);
  const stats = useMemo(()=>computeCommunityStats(teams,groupResults),[teams,groupResults]);
  const [selectedTeam, setSelectedTeam] = useState(teamNames[0]||null);
  useEffect(()=>{
    if (!selectedTeam&&teamNames.length>0) setSelectedTeam(teamNames[0]);
    if (selectedTeam&&!teams[selectedTeam]) setSelectedTeam(teamNames[0]||null);
  },[teams]);
  const summary = selectedTeam ? computeTeamSummary(selectedTeam,teams,groupResults) : null;

  if (teamNames.length===0) return <EmptyState text="Belum ada data. Tambahkan tim dan input hasil match dulu ya! 📊" />;

  return (
    <div>
      <SectionTitle emoji="📊">Statistik Komunitas</SectionTitle>

      {/* TOP STATS */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:20}}>
        <StatBox num={stats.teamCount}              label="Total Tim"         emoji="🛡️" />
        <StatBox num={stats.groupCount}             label="Divisi Aktif"      emoji="⚡" />
        <StatBox num={stats.totalMatches}           label="Match Selesai"     emoji="⚔️" />
        <StatBox num={stats.totalCards}             label="Kartu Terdaftar"   emoji="🃏" />
        <StatBox num={stats.completeDecks}          label="Deck 60 Kartu"     emoji="✅" />
        <StatBox num={stats.avgPerMatch.toFixed(1)} label="Avg Prize/Match"   emoji="🏅" />
      </div>

      {/* 3 RANKING CARDS */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:14, marginBottom:20}}>
        <RankCard title="🏆 Win Rate Tertinggi" rows={stats.winRateRanking.slice(0,8)}
          val={r=>`${r.winRate.toFixed(0)}%`} sub={r=>`${r.w}W ${r.d}D ${r.l}L`} />
        <RankCard title="⚔️ Prize Cards (GF)" rows={stats.topScorers.slice(0,8)}
          val={r=>r.gf} sub={r=>`${r.pl} match · Div ${r.group}`} />
        <RankCard title="🛡️ Pertahanan Terbaik" rows={stats.bestDefense.slice(0,8)}
          val={r=>r.ga} sub={r=>`GA tersedikit · Div ${r.group}`} />
      </div>

      {/* KARTU POPULER + DISTRIBUSI */}
      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14, marginBottom:20}}>
        <div style={{...card(), padding:16}}>
          <div className="bebas" style={{fontSize:16,color:C.accent,marginBottom:10}}>🃏 Kartu Paling Banyak Dipakai</div>
          {stats.popularCards.length===0
            ? <div style={{color:C.dim,fontSize:12}}>Belum ada deck terdaftar.</div>
            : stats.popularCards.slice(0,10).map((c,i)=>(
              <div key={c.name+c.category} style={{
                display:'flex', alignItems:'center', gap:8, padding:'5px 10px',
                background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, marginBottom:4, fontSize:12,
              }}>
                <span style={{width:18,textAlign:'center',color:C.dim,fontSize:10}}>{i+1}</span>
                <span style={{...pill(CATEGORY_COLORS[c.category]), fontSize:9}}>{CATEGORY_LABELS_SHORT[c.category]}</span>
                <span style={{flex:1}}>{c.name}</span>
                <span style={{color:C.dim,fontSize:11}}>{c.teamCount} tim</span>
              </div>
            ))
          }
        </div>

        <div style={{...card(), padding:16}}>
          <div className="bebas" style={{fontSize:16,color:C.accent,marginBottom:10}}>📊 Distribusi Kategori</div>
          {Object.keys(stats.categoryTotals).length===0
            ? <div style={{color:C.dim,fontSize:12}}>Belum ada deck.</div>
            : Object.keys(CATEGORY_LABELS_SHORT).map(cat=>{
              const total = stats.categoryTotals[cat]||0;
              const max = Math.max(...Object.values(stats.categoryTotals),1);
              return (
                <div key={cat} style={{marginBottom:10}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3}}>
                    <span>{CATEGORY_LABELS[cat]}</span>
                    <span style={{color:C.dim}}>{total} kartu</span>
                  </div>
                  <div style={{height:7, background:C.surface, borderRadius:99, border:`1px solid ${C.border}`}}>
                    <div style={{
                      height:'100%', borderRadius:99, background:CATEGORY_COLORS[cat],
                      width:`${total/max*100}%`, transition:'width .4s',
                    }}/>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* DETAIL PER TIM */}
      <SectionTitle emoji="👤">Detail Tim</SectionTitle>
      <div style={{display:'grid', gridTemplateColumns:'200px 1fr', gap:14}}>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {teamNames.map(name=>(
            <div key={name} onClick={()=>setSelectedTeam(name)} style={{
              ...card(), padding:'8px 12px', cursor:'pointer',
              background: selectedTeam===name?`linear-gradient(135deg,${C.card},#3d1470)`:C.card,
              border:`1px solid ${selectedTeam===name?C.accent2:C.border}`,
            }}>
              <div style={{fontWeight:700,fontSize:12,color:selectedTeam===name?C.accent2:C.text}}>🛡️ {name}</div>
              <div style={{fontSize:10,color:C.dim}}>Div {teams[name].group||'A'}</div>
            </div>
          ))}
        </div>
        {summary && <TeamStatsDetail summary={summary} />}
      </div>
    </div>
  );
}

function RankCard({ title, rows, val, sub }) {
  return (
    <div style={{...card(), padding:16}}>
      <div className="bebas" style={{fontSize:16, color:C.accent, marginBottom:10}}>{title}</div>
      {rows.length===0
        ? <div style={{color:C.dim,fontSize:12}}>Belum ada match dimainkan.</div>
        : rows.map((r,i)=>(
          <div key={r.team} style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'5px 10px', background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:6, marginBottom:4, fontSize:12,
          }}>
            <span style={{width:22, textAlign:'center', fontSize:i<3?18:11, flexShrink:0}}>
              {['🥇','🥈','🥉'][i]||<span style={{color:C.dim}}>{i+1}</span>}
            </span>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.team}</div>
              <div style={{fontSize:10, color:C.dim}}>{sub(r)}</div>
            </div>
            <span className="bebas" style={{fontSize:18, color:C.accent, flexShrink:0}}>{val(r)}</span>
          </div>
        ))
      }
    </div>
  );
}

function TeamStatsDetail({ summary }) {
  const { team, player, group, pl, w, d, l, gf, ga, pts, gd, winRate, deck, totalCards, matchLog } = summary;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{...card(), padding:16}}>
        <div className="bebas" style={{fontSize:20, color:C.accent}}>🛡️ {team}</div>
        <div style={{fontSize:12, color:C.dim, marginBottom:12}}>{player||'Belum ada pemain'} · Divisi {group}</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(80px,1fr))', gap:8}}>
          {[['Match',pl,'⚔️'],[`${w}-${d}-${l}`,'W-D-L','📊'],
            [`${winRate.toFixed(0)}%`,'Win Rate','🏆'],
            [pts,'Points','⭐'],[`${gf}/${ga}`,'GF/GA','🎯'],
            [`${gd>0?'+':''}${gd}`,'Selisih',gd>0?'📈':'📉']].map(([v,l,e])=>(
            <div key={l} style={{background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 10px', textAlign:'center'}}>
              <div style={{fontSize:16, marginBottom:2}}>{e}</div>
              <div className="bebas" style={{fontSize:20, color:C.accent, lineHeight:1}}>{v}</div>
              <div style={{fontSize:9, color:C.dim, textTransform:'uppercase', letterSpacing:1}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{...card(), padding:16}}>
        <div className="bebas" style={{fontSize:16, color:C.accent, marginBottom:10}}>⚔️ Riwayat Match</div>
        {matchLog.length===0
          ? <div style={{color:C.dim,fontSize:12}}>Belum ada hasil match.</div>
          : matchLog.map((m,i)=>(
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'5px 10px', background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:6, marginBottom:4, fontSize:12,
            }}>
              <span style={{
                width:24, height:24, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, fontWeight:700, flexShrink:0,
                background: m.result==='W'?C.green+'22':m.result==='L'?C.red+'22':C.dim+'22',
                color: m.result==='W'?C.green:m.result==='L'?C.red:C.dim,
                border: `1px solid ${m.result==='W'?C.green:m.result==='L'?C.red:C.dim}44`,
              }}>{m.result==='W'?'✅':m.result==='L'?'❌':'🤝'}</span>
              <span style={{flex:1}}>vs {m.opponent}</span>
              <span className="bebas" style={{fontSize:14}}>{m.myScore} – {m.oppScore}</span>
            </div>
          ))
        }
      </div>

      <div style={{...card(), padding:16}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
          <div className="bebas" style={{fontSize:16, color:C.accent}}>🃏 Deck</div>
          <span style={{...pill(totalCards===60?C.green:C.orange)}}>{totalCards}/60</span>
        </div>
        {deck.length===0
          ? <div style={{color:C.dim,fontSize:12}}>Deck belum diisi.</div>
          : Object.keys(CATEGORY_LABELS_SHORT).map(cat=>{
            const cards = deck.filter(c=>c.category===cat);
            if (!cards.length) return null;
            return (
              <div key={cat} style={{marginBottom:8}}>
                <div style={{fontSize:10, color:CATEGORY_COLORS[cat], textTransform:'uppercase', letterSpacing:1, fontWeight:700, marginBottom:4}}>
                  {CATEGORY_LABELS[cat]} ({cards.reduce((s,c)=>s+c.qty,0)})
                </div>
                <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
                  {cards.map(c=>(
                    <div key={c.name} style={{
                      fontSize:11, background:C.surface, border:`1px solid ${C.border}`,
                      borderRadius:20, padding:'2px 8px', display:'flex', alignItems:'center', gap:4,
                    }}>
                      {c.name} <span className="bebas" style={{color:C.accent}}>×{c.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ══════════════════════ ADMIN TAB ══════════════════════
function AdminTab({ users, saveUsers, teams, groupResults, showToast, currentUser }) {
  const pending  = Object.values(users).filter(u=>u.status==='pending');
  const approved = Object.values(users).filter(u=>u.status==='approved');
  const rejected = Object.values(users).filter(u=>u.status==='rejected');
  const fileRef = useRef(null);

  const approve = async (username) => {
    const updated = { ...users, [username]: { ...users[username], status:'approved' } };
    await saveUsers(updated);
    showToast(`✅ ${username} disetujui!`);
  };
  const reject = async (username) => {
    const updated = { ...users, [username]: { ...users[username], status:'rejected' } };
    await saveUsers(updated);
    showToast(`❌ ${username} ditolak`,'warn');
  };
  const deleteUser = async (username) => {
    if (!confirm(`Hapus user "${username}" permanen?`)) return;
    const updated = { ...users };
    delete updated[username];
    await saveUsers(updated);
    showToast('User dihapus');
  };
  const promoteToAdmin = async (username) => {
    if (!confirm(`Jadikan "${username}" admin?`)) return;
    const updated = { ...users, [username]: { ...users[username], role:'admin' } };
    await saveUsers(updated);
    showToast(`👑 ${username} jadi admin!`);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url;
    a.download=`sansan-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('✅ Backup diunduh!');
  };

  return (
    <div>
      <SectionTitle emoji="👑">Panel Admin</SectionTitle>

      {/* RINGKASAN */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:20}}>
        <StatBox num={Object.keys(users).length} label="Total User"   emoji="👥" />
        <StatBox num={pending.length}             label="Pending"      emoji="⏳" />
        <StatBox num={approved.length}            label="Approved"     emoji="✅" />
        <StatBox num={Object.keys(teams).length}  label="Total Tim"    emoji="🛡️" />
        <StatBox num={Object.keys(groupResults).length} label="Match"  emoji="⚔️" />
      </div>

      {/* PENDING APPROVAL */}
      {pending.length > 0 && (
        <div style={{...card(), padding:16, marginBottom:14, border:`1px solid ${C.orange}44`}}>
          <div className="bebas" style={{fontSize:16, color:C.orange, marginBottom:10}}>
            ⏳ Menunggu Approval ({pending.length})
          </div>
          {pending.map(u=>(
            <div key={u.username} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'8px 12px', background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:8, marginBottom:6,
            }}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, fontSize:13}}>{u.displayName}</div>
                <div style={{fontSize:11, color:C.dim}}>@{u.username} · {new Date(u.createdAt).toLocaleDateString('id-ID')}</div>
              </div>
              <button onClick={()=>approve(u.username)} style={{...btnSuccess, padding:'6px 12px', fontSize:12}}>
                <CheckCircle size={13}/> Approve
              </button>
              <button onClick={()=>reject(u.username)} style={{...btnDanger, padding:'6px 12px', fontSize:12}}>
                <XCircle size={13}/> Tolak
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ALL USERS */}
      <div style={{...card(), padding:16, marginBottom:14}}>
        <div className="bebas" style={{fontSize:16, color:C.accent, marginBottom:10}}>👥 Semua User</div>
        {[...approved, ...rejected].map(u=>(
          <div key={u.username} style={{
            display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
            padding:'8px 12px', background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:8, marginBottom:6,
          }}>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:6}}>
                {u.role==='admin'&&<Crown size={13} style={{color:C.accent,flexShrink:0}}/>}
                {u.displayName}
              </div>
              <div style={{fontSize:11, color:C.dim}}>@{u.username}</div>
            </div>
            <span style={{
              ...pill(u.status==='approved'?C.green:u.status==='rejected'?C.red:C.orange),
              fontSize:10,
            }}>
              {u.status==='approved'?'✅ Approved':u.status==='rejected'?'❌ Ditolak':'⏳ Pending'}
            </span>
            {u.username !== currentUser.username && (
              <>
                {u.status==='rejected' && (
                  <button onClick={()=>approve(u.username)} style={{...btnSuccess,padding:'4px 8px',fontSize:11}}>
                    <CheckCircle size={11}/> Re-approve
                  </button>
                )}
                {u.role!=='admin' && (
                  <button onClick={()=>promoteToAdmin(u.username)} style={{...btnGhost,padding:'4px 8px',fontSize:11}}>
                    <Crown size={11}/> Jadikan Admin
                  </button>
                )}
                <button onClick={()=>deleteUser(u.username)} style={{...btnDanger,padding:'4px 8px',fontSize:11}}>
                  <Trash2 size={11}/>
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* BACKUP */}
      <div style={{...card(), padding:16}}>
        <div className="bebas" style={{fontSize:16, color:C.accent, marginBottom:10}}>💾 Backup Data</div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <button onClick={handleExport} style={btnSuccess}>
            <Download size={14}/> Export Backup JSON
          </button>
          <button onClick={()=>fileRef.current?.click()} style={btnGhost}>
            <Upload size={14}/> Import Backup JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json" style={{display:'none'}} onChange={e=>{
            const file=e.target.files[0]; if (!file) return;
            const r=new FileReader();
            r.onload=ev=>{ try{ importAllData(JSON.parse(ev.target.result)); showToast('✅ Data diimpor! Refresh halaman.'); } catch{ showToast('File tidak valid','error'); }};
            r.readAsText(file); e.target.value='';
          }} />
        </div>
        <div style={{fontSize:11, color:C.dim, marginTop:8}}>
          💡 Export secara rutin untuk backup. Import akan mengganti data lokal (perlu refresh setelah import).
        </div>
      </div>
    </div>
  );
}

// ══════════════════════ BACKUP BAR (footer) ══════════════════════
function BackupBar({ showToast }) {
  const fileRef = useRef(null);
  return (
    <div style={{
      maxWidth:1400, margin:'0 auto', padding:'8px 12px 24px',
      display:'flex', gap:8, justifyContent:'flex-end', flexWrap:'wrap',
    }}>
      <button onClick={()=>{
        const blob=new Blob([JSON.stringify(exportAllData(),null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url; a.download=`sansan-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
        URL.revokeObjectURL(url); showToast('✅ Backup diunduh!');
      }} style={btnGhost}><Download size={13}/> Export</button>
      <button onClick={()=>fileRef.current?.click()} style={btnGhost}><Upload size={13}/> Import</button>
      <input ref={fileRef} type="file" accept="application/json" style={{display:'none'}} onChange={e=>{
        const file=e.target.files[0]; if (!file) return;
        const r=new FileReader();
        r.onload=ev=>{ try{ importAllData(JSON.parse(ev.target.result)); showToast('✅ Data diimpor! Refresh halaman.'); } catch{ showToast('File tidak valid','error'); }};
        r.readAsText(file); e.target.value='';
      }} />
    </div>
  );
}
