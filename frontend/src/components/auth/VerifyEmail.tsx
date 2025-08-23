import React, { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { verifyEmailToken, resendVerification } from '../../api/authExtras';
import { useAuth } from '../../contexts/AuthContext';

export const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'checking'|'ok'|'fail'>('checking');
  const { user } = useAuth();
  useEffect(()=>{
    if(!token){ setStatus('fail'); return; }
    (async ()=>{
      const ok = await verifyEmailToken(token);
      setStatus(ok? 'ok':'fail');
      toast[ok? 'success':'error'](ok? 'Email verified!' : 'Invalid or expired link');
    })();
  },[token]);
  if(status==='checking') return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"/></div>;
  if(status==='ok') return <Navigate to={user? '/dashboard':'/login'} replace />;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
      <p className="mb-4 text-gray-600">The verification link is invalid or expired.</p>
      {user && <button onClick={()=>{ if(user.email){ resendVerification(user.email).then(()=> toast.success('Verification email resent')); } }} className="px-4 py-2 rounded bg-blue-600 text-white">Resend Verification</button>}
    </div>
  );
};
