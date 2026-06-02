// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import api from '@/lib/api';
// import Link from 'next/link';
// import { LogIn, Mail, Lock, AlertCircle, RefreshCw } from 'lucide-react';

// /**
//  * Enhanced Login Page
//  *
//  * High-quality, modern fintech look with clean typography and soft shadows.
//  */
// export default function LoginPage() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     const token = searchParams.get('token');
//     const user = searchParams.get('user');
//     if (token && user) {
//       localStorage.setItem('auth_token', token);
//       router.push('/dashboard');
//     }
//   }, [searchParams, router]);

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const response = await api.post('/login', { email, password });
//       localStorage.setItem('auth_token', response.data.access_token);
//       router.push('/dashboard');
//     } catch (error: unknown) {
//       const errResponse = error as {
//         response?: { data?: { message?: string } };
//       };
//       setError(errResponse.response?.data?.message || 'Invalid email or password');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-slate-50">
//       <div className="w-full max-w-sm space-y-10 animate-slide-up">
//         {/* Logo Section */}
//         <div className="text-center space-y-3">
//           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-200">
//             <RefreshCw size={32} />
//           </div>
//           <h1 className="text-3xl font-black tracking-tight text-slate-900">
//             Pasona<span className="text-blue-600">.</span>
//           </h1>
//           <p className="text-slate-500 font-medium">Smart financial tracking for you</p>
//         </div>

//         {/* Login Form */}
//         <div className="bg-white p-8 rounded-[2.5rem] card-shadow border border-slate-100 space-y-6">
//           <form onSubmit={handleLogin} className="space-y-6">
//             {error && (
//               <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl flex items-center gap-2 border border-red-100">
//                 <AlertCircle size={18} />
//                 {error}
//               </div>
//             )}

//             <div className="space-y-2">
//               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
//               <div className="relative group">
//                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
//                 <input
//                   type="email"
//                   required
//                   placeholder="name@example.com"
//                   className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none input-focus text-sm font-medium"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
//               <div className="relative group">
//                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
//                 <input
//                   type="password"
//                   required
//                   placeholder="••••••••"
//                   className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none input-focus text-sm font-medium"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-4.5 premium-gradient text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
//             >
//               {loading ? (
//                 <RefreshCw className="animate-spin" size={20} />
//               ) : (
//                 <>
//                   <LogIn size={20} />
//                   Sign In
//                 </>
//               )}
//             </button>
//           </form>

//           <div className="text-center">
//             <Link href="/forgot-password" className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
//               Forgot your password?
//             </Link>
//           </div>
//         </div>

//         {/* Footer */}
//         <p className="text-center text-xs text-slate-400 font-medium">
//           Don&apos;t have an account? <span className="text-blue-600 font-bold hover:underline cursor-pointer">Register now</span>
//         </p>
//       </div>
//     </div>
//   );
// }