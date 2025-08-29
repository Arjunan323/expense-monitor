import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { taxApi, TaxDeductionChecklistItem, TaxSavingTip } from '../../api/client';

const ChecklistAndTips: React.FC = () => {
  const [checklist, setChecklist] = useState<TaxDeductionChecklistItem[]>([]);
  const [tips, setTips] = useState<TaxSavingTip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      taxApi.getChecklist(),
      taxApi.getTips()
    ]).then(([cl, tp]) => {
      if (mounted) {
        setChecklist(cl);
        setTips(tp);
        setLoading(false);
      }
    }).catch(e => {
      setError('Failed to load checklist/tips');
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-6 text-center text-brand-gray-500">Loading checklist & tips...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-6">📋 Tax Deduction Checklist</h3>
        <div className="space-y-3">
          {checklist.length === 0 && <div className="p-3 text-sm text-brand-gray-500">No checklist items found.</div>}
          {checklist.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-brand-gray-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${item.checked ? 'bg-brand-green-500' : 'bg-brand-gray-300'}`}>
                  {item.checked && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-brand-gray-700">{item.item}</span>
              </div>
              <span className="text-sm font-semibold text-brand-gray-900">{item.amount || ''}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card bg-gradient-to-br from-brand-blue-50 to-brand-green-50 border-brand-blue-200">
        <h3 className="text-xl font-heading font-bold text-brand-gray-900 mb-6">💡 Tax Saving Tips</h3>
        <div className="space-y-4">
          {tips.length === 0 && <div className="p-3 text-sm text-brand-gray-500">No tips found.</div>}
          {tips.map(tip => (
            <div key={tip.id} className="p-4 bg-white/60 rounded-2xl">
              <h4 className="font-semibold text-brand-gray-900 mb-2">{tip.icon ? `${tip.icon} ` : ''}{tip.title}</h4>
              <p className="text-sm text-brand-gray-700">{tip.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChecklistAndTips;
