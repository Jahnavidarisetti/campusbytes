import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { createClient } from '@supabase/supabase-js';
import { 
  Share2, MessageCircle, Heart, PlusCircle, Camera, 
  LogOut, User, ChevronRight, ChevronLeft, CheckCircle2, Search 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL);
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  
  // Auth & Navigation state
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState(1); 
  const [authRole, setAuthRole] = useState('student');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', accountName: '', userName: '', 
    clubName: '', pageName: '', email: '', password: '', confirmPassword: ''
  });
  const [previewImg, setPreviewImg] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setUser(session.user); fetchProfile(session.user.id); }
    });
    const fetchPosts = async () => {
      try { const res = await axios.get(`${API_URL}/api/posts`); setPosts(res.data); } 
      catch (err) { console.error(err); }
    };
    fetchPosts();
    socket.on('display_post', (newPost) => setPosts((prev) => [newPost, ...prev]));
    return () => socket.off('display_post');
  }, []);

  const fetchProfile = async (uId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uId).single();
    setProfile(data);
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) return alert("Passwords do not match");
    if (!formData.email.endsWith('@slu.edu')) return alert("Use @slu.edu email");

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (error) return alert(error.message);

    let avatarUrl = '';
    if (uploadFile) {
      const fileName = `${data.user.id}/avatar-${Date.now()}`;
      const { data: imgData } = await supabase.storage.from('campusbytes').upload(fileName, uploadFile);
      if (imgData) {
        const { data: url } = supabase.storage.from('campusbytes').getPublicUrl(fileName);
        avatarUrl = url.publicUrl;
      }
    }

    const profilePayload = {
      id: data.user.id,
      email: formData.email,
      role: authRole,
      user_name: formData.userName,
      avatar_url: avatarUrl,
      full_name: authRole === 'admin' ? formData.clubName : `${formData.firstName} ${formData.lastName}`,
      club_name: authRole === 'admin' ? formData.clubName : null,
      slu_id: authRole === 'admin' ? formData.pageName : formData.accountName
    };

    const { error: pError } = await supabase.from('profiles').insert(profilePayload);
    if (pError) alert(pError.message);
    else setStep(3);
  };

  const handleLogin = async () => {
    let emailToUse = loginIdentifier;
    if (!loginIdentifier.includes('@slu.edu')) {
      const { data, error } = await supabase.from('profiles').select('email').eq('user_name', loginIdentifier).single();
      if (error || !data) return alert("Username not found");
      emailToUse = data.email;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
    if (error) alert(error.message);
    else { setUser(data.user); fetchProfile(data.user.id); }
  };

  // --- AUTH VIEWS ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] flex items-center justify-center p-4 font-sans">
        <div className="bg-white w-full max-w-[1000px] min-h-[600px] shadow-2xl rounded-xl flex overflow-hidden border border-gray-200 relative">
          
          {/* Brand Panel */}
          <div className="w-2/5 bg-[#003DA5] p-12 text-white flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
             <h1 className="text-4xl font-black tracking-tighter italic z-10">CAMPUSBYTES</h1>
             <div className="space-y-4 z-10">
                <p className="text-xl font-light leading-relaxed">Your gateway to Saint Louis University life.</p>
                <div className="h-1 w-12 bg-blue-400"></div>
             </div>
             <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest z-10">St. Louis, MO | 2026</div>
          </div>

          {/* Form Panel */}
          <div className="w-3/5 p-12 overflow-y-auto bg-white flex flex-col justify-center">
            {!isRegistering ? (
              <div className="space-y-8 max-w-sm mx-auto w-full">
                <div>
                   <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
                   <p className="text-gray-400 text-sm mt-1">Sign in to continue</p>
                </div>
                <div className="space-y-4">
                  <input placeholder="Username or SLU Email" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" onChange={e => setLoginIdentifier(e.target.value)} />
                  <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="space-y-4 pt-2">
                  <button onClick={handleLogin} className="w-full bg-[#003DA5] text-white py-4 rounded-lg shadow-xl shadow-blue-100 font-bold hover:bg-[#002d7a] transition-all">LOGIN TO APPLICATION</button>
                  <button onClick={() => { setIsRegistering(true); setStep(1); }} className="w-full text-blue-600 font-bold text-sm hover:underline">CREATE NEW SLU ACCOUNT</button>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto w-full space-y-6">
                
                {/* BACK BUTTON for Step 1 or Step 2 */}
                {step < 3 && (
                  <button 
                    onClick={() => step === 1 ? setIsRegistering(false) : setStep(step - 1)} 
                    className="flex items-center gap-1 text-gray-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest transition-all mb-4"
                  >
                    <ChevronLeft size={16}/> Back
                  </button>
                )}

                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Set Up Your Account</h2>
                      <p className="text-gray-400 text-sm">Fill in your SLU credentials</p>
                    </div>
                    
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button onClick={() => setAuthRole('student')} className={`flex-1 py-2 rounded-md font-bold text-xs ${authRole === 'student' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>STUDENT</button>
                      <button onClick={() => setAuthRole('admin')} className={`flex-1 py-2 rounded-md font-bold text-xs ${authRole === 'admin' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}>CLUB ADMIN</button>
                    </div>

                    <div className="space-y-4">
                      {authRole === 'student' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <input placeholder="First Name" className="p-3 border border-gray-100 bg-gray-50 rounded-lg text-sm" onChange={e => setFormData({...formData, firstName: e.target.value})} />
                          <input placeholder="Last Name" className="p-3 border border-gray-100 bg-gray-50 rounded-lg text-sm" onChange={e => setFormData({...formData, lastName: e.target.value})} />
                        </div>
                      ) : (
                        <input placeholder="Club / Organization Name" className="w-full p-3 border border-gray-100 bg-gray-50 rounded-lg font-bold text-sm" onChange={e => setFormData({...formData, clubName: e.target.value})} />
                      )}
                      
                      <input placeholder={authRole === 'student' ? "Account Name (Display Name)" : "Page Name (Sub-heading)"} className="w-full p-3 border border-gray-100 bg-gray-50 rounded-lg text-sm" onChange={e => authRole === 'student' ? setFormData({...formData, accountName: e.target.value}) : setFormData({...formData, pageName: e.target.value})} />
                      <input placeholder="Username (For Login)" className="w-full p-3 border border-gray-100 bg-gray-50 rounded-lg text-sm" onChange={e => setFormData({...formData, userName: e.target.value})} />
                      <input placeholder="University Email (@slu.edu)" className="w-full p-3 border border-gray-100 bg-gray-50 rounded-lg text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input type="password" placeholder="Password" className="p-3 border border-gray-100 bg-gray-50 rounded-lg text-sm" onChange={e => setFormData({...formData, password: e.target.value})} />
                        <input type="password" placeholder="Confirm" className="p-3 border border-gray-100 bg-gray-50 rounded-lg text-sm" onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                      </div>
                    </div>
                    
                    <button onClick={() => setStep(2)} className="w-full bg-[#003DA5] text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-blue-100 transition-all flex justify-center items-center gap-2">CONTINUE <ChevronRight size={18}/></button>
                  </div>
                )}

                {step === 2 && (
                  <div className="text-center space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                       <h2 className="text-2xl font-bold text-gray-800">Profile Identity</h2>
                       <p className="text-gray-400 text-sm">Personalize your {authRole} presence</p>
                    </div>
                    
                    <div className="relative w-40 h-40 mx-auto group">
                      <div className="w-full h-full rounded-full bg-gray-50 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden ring-1 ring-gray-100">
                        {previewImg ? <img src={previewImg} className="w-full h-full object-cover" /> : <User size={64} className="text-blue-100"/>}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-all duration-300">
                        <Camera size={24} className="text-white"/>
                        <input type="file" hidden onChange={e => {
                          setUploadFile(e.target.files[0]);
                          setPreviewImg(URL.createObjectURL(e.target.files[0]));
                        }} />
                      </label>
                    </div>

                    <div className="space-y-4">
                      <button onClick={handleRegister} className="w-full bg-[#003DA5] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-[#002d7a] transition-all uppercase">CONFIRM & CREATE ACCOUNT</button>
                      <button onClick={handleRegister} className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-blue-600 transition-colors">Skip for now &gt;</button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="text-center py-10 space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={40} className="text-green-500" /></div>
                    <div className="space-y-2">
                       <h2 className="text-3xl font-bold text-gray-800 tracking-tight">You're All Set!</h2>
                       <p className="text-gray-500 px-8">Your account has been created. Use your username or email to sign in.</p>
                    </div>
                    <button onClick={() => {setIsRegistering(false); setStep(1);}} className="w-full bg-[#003DA5] text-white py-4 rounded-xl font-bold shadow-lg">GO TO LOGIN</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD (Remains the same as previous) ---
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
       <header className="bg-white border-b px-10 h-20 flex items-center justify-between sticky top-0 z-50">
          <h1 className="text-2xl font-black italic text-[#003DA5]">CAMPUSBYTES</h1>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-4 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                <div className="text-right">
                   <p className="text-xs font-black text-[#003DA5] uppercase">{profile?.role}</p>
                   <p className="text-sm font-bold text-gray-800 leading-tight">{profile?.full_name}</p>
                </div>
                <img src={profile?.avatar_url || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
             </div>
             <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="text-gray-300 hover:text-red-500 transition-all"><LogOut size={24}/></button>
          </div>
       </header>
       <main className="max-w-[1300px] mx-auto py-10 px-4">
          <p className="text-center text-gray-400 font-bold">Campus Feed Active - Welcome, {profile?.full_name}</p>
          {/* Feed logic continues... */}
       </main>
    </div>
  );
}

export default App;