import React, { useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../../api/authExtras';

export const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [pw,setPw]=useState('');
  const [pw2,setPw2]=useState('');
  const [done,setDone]=useState(false);
  const submit = async (e:React.FormEvent)=>{
    e.preventDefault();
    if(pw!==pw2){ toast.error('Passwords do not match'); return; }
    const ok = await resetPassword(token, pw);
    if(ok){ toast.success('Password updated'); setDone(true);} else { toast.error('Reset failed'); }
  };
  if(done) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white shadow p-6 rounded space-y-4">
        <h1 className="text-xl font-bold">Reset Password</h1>
        {!token && <p className="text-red-600 text-sm">Missing token in URL.</p>}
        <label className="block">
          <span className="text-sm font-medium">New Password</span>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} required  className="mt-1 w-full border rounded px-3 py-2"/>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Confirm Password</span>
          <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} required  className="mt-1 w-full border rounded px-3 py-2"/>
        </label>
        <button type="submit" disabled={!token} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-4 py-2 font-medium">Update Password</button>
      </form>
    </div>
  );
};
