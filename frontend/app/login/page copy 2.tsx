// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function LoginPage() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);

//   const handleGoogleLogin = async () => {
//     setLoading(true);
//     // TODO: wire up your actual Google OAuth / NextAuth / Supabase call here
//     // e.g. signIn('google') from next-auth, or supabase.auth.signInWithOAuth({ provider: 'google' })
//     // Simulating for now:
//     setTimeout(() => {
//       localStorage.setItem('auth_token', 'demo_token');
//       router.push('/dashboard');
//     }, 1200);
//   };

//   return (
//     <div
//       className="min-h-screen flex flex-col relative overflow-hidden"
//       style={{ background: '#0a0a0f' }}
//     >
//       {/* Background texture */}
//       <div
//         className="absolute inset-0 pointer-events-none"
//         style={{
//           backgroundImage: `radial-gradient(circle at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 50%),
//                             radial-gradient(circle at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 50%)`,
//         }}
//       />

//       {/* Grid lines — subtle */}
//       <div
//         className="absolute inset-0 pointer-events-none opacity-[0.04]"
//         style={{
//           backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
//                             linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
//           backgroundSize: '40px 40px',
//         }}
//       />

//       {/* Top bar */}
//       <header className="relative z-10 px-6 pt-14 pb-0 flex items-center gap-3">
//         <div
//           className="w-8 h-8 flex items-center justify-center"
//           style={{
//             background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
//             borderRadius: '10px',
//             boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
//           }}
//         >
//           <span style={{ color: 'white', fontSize: '16px', lineHeight: 1, fontFamily: 'Georgia, serif' }}>₦</span>
//         </div>
//         <span
//           style={{
//             fontFamily: '"DM Serif Display", Georgia, serif',
//             fontSize: '18px',
//             color: 'white',
//             letterSpacing: '-0.02em',
//           }}
//         >
//           Pasona
//         </span>
//       </header>

//       {/* Main content */}
//       <main className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-12">

//         {/* Hero text */}
//         <div className="mb-12">
//           <div
//             className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
//             style={{
//               background: 'rgba(99,102,241,0.12)',
//               border: '1px solid rgba(99,102,241,0.25)',
//             }}
//           >
//             <span
//               className="w-1.5 h-1.5 rounded-full"
//               style={{ background: '#6366f1', boxShadow: '0 0 6px #6366f1' }}
//             />
//             <span
//               style={{
//                 fontFamily: 'Geist Mono, monospace',
//                 fontSize: '10px',
//                 color: 'rgba(255,255,255,0.6)',
//                 letterSpacing: '0.15em',
//                 textTransform: 'uppercase',
//               }}
//             >
//               Personal Finance
//             </span>
//           </div>

//           <h2
//             style={{
//               fontFamily: '"DM Serif Display", Georgia, serif',
//               fontSize: '38px',
//               fontWeight: 400,
//               color: 'white',
//               lineHeight: 1.1,
//               letterSpacing: '-0.03em',
//               marginBottom: '12px',
//             }}
//           >
//             Know exactly<br />
//             <span
//               style={{
//                 background: 'linear-gradient(135deg, #818cf8, #6366f1)',
//                 WebkitBackgroundClip: 'text',
//                 WebkitTextFillColor: 'transparent',
//               }}
//             >
//               where it goes.
//             </span>
//           </h2>

//           <p
//             style={{
//               fontFamily: 'Geist, system-ui, sans-serif',
//               fontSize: '14px',
//               color: 'rgba(255,255,255,0.4)',
//               lineHeight: 1.6,
//               maxWidth: '280px',
//             }}
//           >
//             Track income, expenses, and account balances — all in one place.
//           </p>
//         </div>

//         {/* Sign in card */}
//         <div
//           className="rounded-3xl p-6 space-y-4"
//           style={{
//             background: 'rgba(255,255,255,0.04)',
//             border: '1px solid rgba(255,255,255,0.08)',
//             backdropFilter: 'blur(20px)',
//           }}
//         >
//           <p
//             style={{
//               fontFamily: 'Geist, system-ui, sans-serif',
//               fontSize: '12px',
//               color: 'rgba(255,255,255,0.35)',
//               textAlign: 'center',
//               letterSpacing: '0.02em',
//             }}
//           >
//             Sign in to continue
//           </p>

//           {/* Google button */}
//           <button
//             onClick={handleGoogleLogin}
//             disabled={loading}
//             className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl relative overflow-hidden"
//             style={{
//               background: loading
//                 ? 'rgba(255,255,255,0.06)'
//                 : 'white',
//               border: '1px solid rgba(255,255,255,0.1)',
//               transition: 'all 0.2s ease',
//               cursor: loading ? 'not-allowed' : 'pointer',
//             }}
//           >
//             {loading ? (
//               <span
//                 className="w-5 h-5 rounded-full border-2 animate-spin"
//                 style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#6366f1' }}
//               />
//             ) : (
//               <>
//                 {/* Google G logo SVG */}
//                 <svg width="20" height="20" viewBox="0 0 24 24">
//                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
//                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
//                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
//                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
//                 </svg>
//                 <span
//                   style={{
//                     fontFamily: 'Geist, system-ui, sans-serif',
//                     fontSize: '15px',
//                     fontWeight: 600,
//                     color: '#1a1a2e',
//                     letterSpacing: '-0.01em',
//                   }}
//                 >
//                   Continue with Google
//                 </span>
//               </>
//             )}
//           </button>

//           <p
//             style={{
//               fontFamily: 'Geist, system-ui, sans-serif',
//               fontSize: '11px',
//               color: 'rgba(255,255,255,0.2)',
//               textAlign: 'center',
//               lineHeight: 1.5,
//             }}
//           >
//             By continuing, you agree to our Terms of Service<br />and Privacy Policy.
//           </p>
//         </div>
//       </main>

//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');
//       `}</style>
//     </div>
//   );
// }