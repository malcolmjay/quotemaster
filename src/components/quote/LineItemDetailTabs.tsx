import React, { useState, useEffect } from 'react';
import { Trophy, Users, Info, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Company {
  id: string;
  name: string;
}

interface LineItemDetailTabsProps {
  item: any;
  setLineItems: React.Dispatch<React.SetStateAction<any[]>>;
  detailsContent: React.ReactNode;
}

const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setCompanies(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return { companies, loading };
};

type TabKey = 'details' | 'award' | 'bid';

export const LineItemDetailTabs: React.FC<LineItemDetailTabsProps> = ({ item, setLineItems, detailsContent }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const { companies, loading: companiesLoading } = useCompanies();

  const updateField = (field: string, value: any) => {
    setLineItems(prev => prev.map(li =>
      li.id === item.id ? { ...li, [field]: value } : li
    ));
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'details', label: 'Details', icon: <Info className="h-3.5 w-3.5" /> },
    { key: 'award', label: 'Award Info', icon: <Trophy className="h-3.5 w-3.5" /> },
    { key: 'bid', label: 'Bid Info', icon: <Users className="h-3.5 w-3.5" /> },
  ];

  const hasAwardData = item.award_company_id || item.award_price || item.award_quantity || item.award_contract_number;
  const hasBidData = item.bid_competitor_1_id || item.bid_price_1 || item.bid_competitor_2_id;

  return (
    <div>
      <div className="flex items-center gap-1 mb-3 border-b border-[#dce0e6] dark:border-slate-600">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const hasDot = (tab.key === 'award' && hasAwardData) || (tab.key === 'bid' && hasBidData);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-[#1a6fb5] text-[#1a6fb5] dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-[#5f6672] dark:text-slate-400 hover:text-[#333] dark:hover:text-slate-300 hover:border-[#ccc]'
              }`}
            >
              {tab.icon}
              {tab.label}
              {hasDot && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1a6fb5]" />
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'details' && (
        <div className="space-y-3">
          {detailsContent}
        </div>
      )}

      {activeTab === 'award' && (
        <div className="bg-[#f8f9fb] dark:bg-slate-700/30 rounded-lg p-4 border border-[#dce0e6] dark:border-slate-600">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Company Name</label>
              {companiesLoading ? (
                <div className="flex items-center gap-2 py-2"><Loader2 className="h-3 w-3 animate-spin text-[#999]" /><span className="text-xs text-[#999]">Loading...</span></div>
              ) : (
                <select
                  value={item.award_company_id || ''}
                  onChange={(e) => updateField('award_company_id', e.target.value || null)}
                  className="w-full px-3 py-2 border border-[#dce0e6] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5] transition-all"
                >
                  <option value="">Select company...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.award_price ?? ''}
                  onChange={(e) => updateField('award_price', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-[#dce0e6] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5] transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                value={item.award_quantity ?? ''}
                onChange={(e) => updateField('award_quantity', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="0"
                className="w-full px-3 py-2 border border-[#dce0e6] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Contract #</label>
              <input
                type="text"
                value={item.award_contract_number || ''}
                onChange={(e) => updateField('award_contract_number', e.target.value || null)}
                placeholder="Enter contract number..."
                className="w-full px-3 py-2 border border-[#dce0e6] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5] transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bid' && (
        <div className="bg-[#f8f9fb] dark:bg-slate-700/30 rounded-lg p-4 border border-[#dce0e6] dark:border-slate-600">
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Competitor 1</label>
                {companiesLoading ? (
                  <div className="flex items-center gap-2 py-2"><Loader2 className="h-3 w-3 animate-spin text-[#999]" /><span className="text-xs text-[#999]">Loading...</span></div>
                ) : (
                  <select
                    value={item.bid_competitor_1_id || ''}
                    onChange={(e) => updateField('bid_competitor_1_id', e.target.value || null)}
                    className="w-full px-3 py-2 border border-[#dce0e6] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5] transition-all"
                  >
                    <option value="">Select competitor...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Bid Price 1</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.bid_price_1 ?? ''}
                    onChange={(e) => updateField('bid_price_1', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-[#dce0e6] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Bid Price 2</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#999]">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.bid_price_2 ?? ''}
                    onChange={(e) => updateField('bid_price_2', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-[#dce0e6] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#dce0e6] dark:border-slate-600 pt-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#5f6672] dark:text-slate-400 mb-1">Competitor 2</label>
                  {companiesLoading ? (
                    <div className="flex items-center gap-2 py-2"><Loader2 className="h-3 w-3 animate-spin text-[#999]" /><span className="text-xs text-[#999]">Loading...</span></div>
                  ) : (
                    <select
                      value={item.bid_competitor_2_id || ''}
                      onChange={(e) => updateField('bid_competitor_2_id', e.target.value || null)}
                      className="w-full px-3 py-2 border border-[#dce0e6] dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-700 text-[#333] dark:text-white focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5] transition-all"
                    >
                      <option value="">Select competitor...</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
