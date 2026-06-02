'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { LogOut, Bell, Shield, ChevronRight } from 'lucide-react';

import { Skeleton } from '@/components/Skeleton';
import { ErrorMessage } from '@/components/ErrorMessage';

type User = {
  name?: string;
  email?: string;
  reminder_time?: string;
};

/**
 * Enhanced Settings Page
 * 
 * High-quality management interface for profile and app settings.
 */
export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reminderTime, setReminderTime] = useState('21:10');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  const fetchProfile = async () => {
    setError(false);
    setLoading(true);
    try {
      const res = await api.get('/me');
      setUser(res.data);
      setReminderTime(res.data.reminder_time || '21:10');
    } catch {
      console.error('Failed to load profile');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchProfile();
    };

    void initialize();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch {
      console.error('Logout failed');
    } finally {
      localStorage.removeItem('auth_token');
      router.push('/login');
    }
  };

  const handleSaveReminder = async () => {
    try {
      // Mock reminder update
      alert('Reminder time updated! Notifications will trigger at ' + reminderTime);
    } catch {
      alert('Failed to update reminder');
    }
  };

  if (loading) return (
    <div className="p-6 space-y-8">
      <Skeleton className="h-8 w-32 ml-2" />
      <div className="bg-white p-6 rounded-[2.5rem] card-shadow space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-24 ml-2" />
        <Skeleton className="h-20 w-full rounded-[2.5rem]" />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <ErrorMessage message="Could not load your profile." onRetry={fetchProfile} />
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-slide-up">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h2>

      {/* Profile Section */}
      <section className="bg-white p-6 rounded-[2.5rem] card-shadow border border-slate-50 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-black shadow-lg shadow-blue-100">
            {user?.name?.[0]}
          </div>
          <div>
            <p className="font-black text-slate-900 text-lg">{user?.name}</p>
            <p className="text-xs font-bold text-slate-400">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Reminders Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Notifications</h3>
        <div className="bg-white p-6 rounded-[2.5rem] card-shadow border border-slate-50 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Daily Reminder</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Log your daily expenses</p>
              </div>
            </div>
            <input
              type="time"
              className="bg-slate-50 p-2.5 rounded-xl font-black text-blue-600 outline-none text-sm"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              onBlur={handleSaveReminder}
            />
          </div>
        </div>
      </section>

      {/* App Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">App Details</h3>
        <div className="bg-white rounded-[2.5rem] card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-50">
          <div className="p-6 flex items-center justify-between group cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <Shield size={20} />
              </div>
              <span className="text-sm font-bold text-slate-700">Privacy Policy</span>
            </div>
            <ChevronRight size={18} className="text-slate-200" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full p-6 flex items-center justify-between group hover:bg-red-50/50 transition-colors"
          >
            <div className="flex items-center gap-4 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                <LogOut size={20} />
              </div>
              <span className="text-sm font-black uppercase tracking-tight">Sign Out</span>
            </div>
            <ChevronRight size={18} className="text-red-100" />
          </button>
        </div>
      </section>

      <div className="text-center pt-8 opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Pasona Finance v1.0.0</p>
      </div>

      <Navbar />
    </div>
  );
}
