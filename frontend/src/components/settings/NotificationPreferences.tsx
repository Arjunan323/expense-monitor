import React, { useEffect, useState } from 'react';
import { listNotificationPrefs, upsertNotificationPref, NotificationPreferenceDto } from '../../api/notificationPreferences';
import toast from 'react-hot-toast';

const KNOWN_TYPES = [
  'SPENDING_ALERT',
  'LOW_BALANCE',
  'GOAL_MILESTONE',
  'GOAL_NUDGE',
  'VERIFICATION',
  'PASSWORD_RESET'
];

export const NotificationPreferences: React.FC = () => {
  const [prefs,setPrefs]=useState<NotificationPreferenceDto[]>([]);
  const [loading,setLoading]=useState(true);
  const map = new Map(prefs.map(p=>[p.type,p] as const));
  const merged = KNOWN_TYPES.map(t=> map.get(t) || { id:0, type:t, emailEnabled:true });

  useEffect(()=>{ (async()=>{ try { setLoading(true); const data = await listNotificationPrefs(); setPrefs(data);} catch { /* ignore */ } finally { setLoading(false);} })(); },[]);

  const toggle = async (t:string, current:boolean) => {
    try { const updated = await upsertNotificationPref(t, !current); setPrefs(prev=>{ const others = prev.filter(p=>p.type!==t); return [...others, updated];}); toast.success(`${t.replace('_',' ')} ${!current? 'enabled':'disabled'}`);} catch { toast.error('Update failed'); }
  };

  if(loading) return <div className='p-4 text-sm text-gray-500'>Loading notification preferences...</div>;
  return (
    <div className='space-y-4'>
      <h2 className='text-lg font-semibold'>Email Notification Preferences</h2>
      <div className='space-y-2'>
        {merged.map(p=> (
          <div key={p.type} className='flex items-center justify-between p-3 border rounded bg-white shadow-sm'>
            <div>
              <div className='font-medium text-sm'>{p.type.replace('_',' ')}</div>
              <div className='text-xs text-gray-500'>{p.emailEnabled? 'Emails enabled':'Emails disabled'}</div>
            </div>
            <button onClick={()=>toggle(p.type, p.emailEnabled)} className={`px-3 py-1 text-xs rounded font-medium ${p.emailEnabled? 'bg-green-600 text-white':'bg-gray-200 text-gray-700'}`}>{p.emailEnabled? 'Disable':'Enable'}</button>
          </div>
        ))}
      </div>
    </div>
  );
};
