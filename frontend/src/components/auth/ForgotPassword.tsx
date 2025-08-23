import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { requestPasswordReset } from '../../api/authExtras';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async (e:React.FormEvent)=>{
    e.preventDefault();
    if(!email) return;
    try { await requestPasswordReset(email); setSent(true); toast.success('If the email exists, a reset link was sent'); }
    catch { toast.error('Failed to send reset email'); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white shadow p-6 rounded space-y-4">
        <h1 className="text-xl font-bold">Forgot Password</h1>
        {sent? <p className="text-green-600">Check your email for a reset link.</p> : <>
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required className="mt-1 w-full border rounded px-3 py-2"/>
          </label>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-medium">Send Reset Link</button>
        </>}
      </form>
    </div>
  );
};
