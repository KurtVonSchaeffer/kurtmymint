import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  TrendingUp, 
  Wallet, 
  ChevronRight, 
  Users,
  History,
  LayoutGrid,
  Target,
  PlusCircle,
  Trophy,
  X,
  ArrowDownToLine,
  Newspaper,
  ShieldCheck,
  FileSignature
} from 'lucide-react';
import { useFamilyStore } from '../store/useFamilyStore';
import { useProfile } from '../lib/useProfile';
import { supabase } from '../lib/supabase';
import AddMemberModal from '../components/AddMemberModal';
import AppLayout from '../layouts/AppLayout';
import NavigationPill from '../components/NavigationPill';
import NotificationBell from '../components/NotificationBell';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Constants
const MOCK_CHART_DATA = [
  { day: 'Mon', value: 4200 },
  { day: 'Tue', value: 4500 },
  { day: 'Wed', value: 4100 },
  { day: 'Thu', value: 5200 },
  { day: 'Fri', value: 5800 },
  { day: 'Sat', value: 6100 },
  { day: 'Sun', value: 7200 },
];

const ANIMATION_DURATIONS = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5
};

// Extracted Components
const FamilyMemberCard = React.memo(({ 
  member, 
  isSelected, 
  onSelect, 
  onRemove,
  formatCurrency,
  parentName
}) => {
  const fullName = `${member.first_name} ${member.last_name || ''}`.trim();
  const displayInitials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase();
  const mintId = (member.id || '').substring(0, 8).toUpperCase();
  
  const cardClasses = useMemo(() => `
    relative flex-shrink-0 w-48 aspect-[3/4] rounded-[32px] p-5 flex flex-col items-center justify-between gap-1 transition-all snap-start border-2
    ${isSelected 
      ? 'bg-gradient-to-br from-white to-purple-50 border-purple-600 shadow-xl shadow-purple-900/10 scale-105 z-10 ring-2 ring-purple-600/50' 
      : 'bg-white border-slate-100 hover:border-purple-200 shadow-sm hover:shadow-md'}
  `, [isSelected]);

  const avatarClasses = useMemo(() => `
    w-16 h-16 rounded-[24px] mb-1 flex items-center justify-center text-2xl font-black shadow-sm transition-all
    ${member.gender === 'Girl' 
      ? 'bg-gradient-to-br from-pink-100 to-pink-50 text-pink-600' 
      : member.gender === 'Boy'
      ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600'
      : 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600'}
    ${isSelected ? 'ring-4 ring-purple-600/20 scale-105' : ''}
  `, [member.gender, isSelected]);

  return (
    <button
      onClick={onSelect}
      className={cardClasses}
      aria-label={`Select ${fullName}`}
    >
      <div className="absolute top-4 right-4">
        <button 
          onClick={(e) => onRemove(e, member.id, fullName)}
          className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-slate-400 hover:text-rose-500 transition-all shadow-sm hover:shadow-md"
          aria-label={`Remove ${fullName}`}
        >
          <X size={10} />
        </button>
      </div>

      <div className="w-full flex justify-start">
         <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[8px] font-black text-slate-400 tracking-widest uppercase">ID: #{mintId}</span>
      </div>

      <div className={avatarClasses}>
        {displayInitials || member.first_name?.[0] || '👤'}
      </div>
      
      <div className="text-center min-w-0 w-full">
        <p className="text-sm font-black text-slate-900 truncate" title={fullName}>
          {fullName}
        </p>
        <div className="mt-1 flex items-center justify-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${member.gender === 'Girl' ? 'bg-pink-400' : member.gender === 'Boy' ? 'bg-blue-400' : 'bg-purple-400'}`} />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            {member.gender || 'Child'}
          </p>
        </div>
        <p className="text-[12px] font-black text-emerald-600 mt-2">
          {formatCurrency(member.available_balance)}
        </p>
      </div>

      <div className="w-full pt-3 border-t border-slate-50 mt-1">
         <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest text-center">Admin: {parentName || 'Parent'}</p>
      </div>
    </button>
  );
});

FamilyMemberCard.displayName = 'FamilyMemberCard';

const ChildProfileHero = React.memo(({ member, parentName, formatCurrency, onApprove, onReject, transactions }) => {
  const pendingRequests = transactions.filter(tx => tx.member_id === member.id && tx.status === 'pending');
  const mintId = (member.id || '').substring(0, 8).toUpperCase();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full rounded-[40px] overflow-hidden bg-slate-900 shadow-2xl p-8 text-white min-h-[420px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.3),transparent_50%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-[9px] font-black tracking-widest text-violet-300 uppercase">MINT-ID: #{mintId}</span>
               <ShieldCheck size={14} className="text-emerald-400" />
            </div>
            <h3 className="text-2xl font-black tracking-tighter">{member.first_name}'s Growth Profile</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Managed by {parentName}</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Available Liquidity</p>
             <p className="text-3xl font-black text-emerald-400 leading-none">{formatCurrency(member.available_balance)}</p>
          </div>
        </div>

        {/* Investment Performance Chart */}
        <div className="h-[180px] w-full mt-8 opacity-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_CHART_DATA}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Approval Queue */}
        {pendingRequests.length > 0 && (
          <div className="mt-6 space-y-4">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                   Review Required ({pendingRequests.length})
                </h4>
             </div>
             <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                       <p className="text-xs font-bold">{req.description || 'Investment Proposal'}</p>
                       <p className="text-[10px] text-white/40">{req.strategy || 'Multi-Asset'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <p className="text-sm font-black text-emerald-400">{formatCurrency(req.amount)}</p>
                       <div className="flex gap-2">
                          <button onClick={() => onReject(req.id)} className="p-2 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"><X size={14} /></button>
                          <button onClick={() => onApprove(req.id)} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"><Plus size={14} /></button>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

ChildProfileHero.displayName = 'ChildProfileHero';

const TransactionItem = React.memo(({ 
  transaction, 
  formatCurrency 
}) => {

  const Icon = transaction.type === 'investment' ? TrendingUp : ArrowDownToLine;
  const colorClass = transaction.type === 'investment' 
    ? 'bg-purple-50 text-purple-600' 
    : 'bg-emerald-50 text-emerald-600';

  return (
    <div className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">
            {transaction.type === 'investment' 
              ? `Invested: ${transaction.strategy}` 
              : transaction.description || 'Allowance'}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {transaction.child_name || 'System'} • {new Date(transaction.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <p className="text-xs font-black text-slate-900">{formatCurrency(transaction.amount)}</p>
    </div>
  );
});

TransactionItem.displayName = 'TransactionItem';

// Custom Hooks
const useInvestmentStrategies = () => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchStrategies = async () => {
      try {
        const { data, error } = await supabase
          .from('strategies')
          .select('*')
          .order('name')
          .abortSignal(abortController.signal);
        
        if (error) throw error;
        setStrategies(data || []);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Error fetching strategies:", err);
          setError('Failed to load investment strategies');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchStrategies();
    
    return () => abortController.abort();
  }, []);

  return { strategies, loading, error };
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Main Component
const FamilyPage = ({ onBack, onOpenCredit, onOpenNotifications, onTabChange }) => {
  const { profile } = useProfile();
  const userId = profile?.id;
  const { 
    members, 
    goals,
    totalNetWorth, 
    parentBalance, 
    loading, 
    isDemoMode,
    fetchFamilyData,
    fetchFamilyTransactions,
    fetchChildGoals,
    createChildGoal,
    sendAllowance,
    fundChildGoal,
    removeMember,
    investForChild,
    transactions,
    approveTransaction,
    rejectTransaction
  } = useFamilyStore();
  
  const [uiState, setUiState] = useState({
    isAddModalOpen: false,
    selectedChildId: null, // Track by ID instead of object
    selectedGoalId: 'wallet',
    opMode: 'transfer',
    activeTopTab: 'home',
    isLedgerModalOpen: false,
    isAddingGoal: false,
    selectedStrategyId: '',
    isProposeMode: false 
  });

  // Derive selected child from ID and members list to ensure data is always fresh
  const selectedChild = useMemo(() => 
    members.find(m => m.id === uiState.selectedChildId),
    [members, uiState.selectedChildId]
  );

  const [formState, setFormState] = useState({
    transferAmount: '',
    newGoalName: '',
    newGoalTarget: ''
  });

  const [isTransferring, setIsTransferring] = useState(false);
  const abortControllerRef = useRef(null);

  const { strategies: actualStrategies, loading: strategiesLoading, error: strategiesError } = useInvestmentStrategies();
  const debouncedTransferAmount = useDebounce(formState.transferAmount, 300);

  const displayName = useMemo(() => 
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" "),
    [profile?.firstName, profile?.lastName]
  );

  const initials = useMemo(() => 
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "KV",
    [displayName]
  );

  const formatCurrency = useCallback((val) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(val || 0);
  }, []);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchFamilyData({ signal: abortControllerRef.current?.signal }),
          fetchFamilyTransactions({ signal: abortControllerRef.current?.signal })
        ]);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error fetching family data:', err);
      }
    };
    fetchData();
    return () => abortControllerRef.current?.abort();
  }, [fetchFamilyData, fetchFamilyTransactions]);

  useEffect(() => {
    if (uiState.selectedChildId) {
      fetchChildGoals(uiState.selectedChildId);
      setUiState(prev => ({ ...prev, selectedGoalId: 'wallet' }));
    }
  }, [uiState.selectedChildId, fetchChildGoals]);

  useEffect(() => {
    if (actualStrategies.length > 0 && !uiState.selectedStrategyId) {
      setUiState(prev => ({ ...prev, selectedStrategyId: actualStrategies[0].id }));
    }
  }, [actualStrategies, uiState.selectedStrategyId]);

  const handleExecuteOperation = useCallback(async () => {
    if (!uiState.selectedChildId) return;
    
    setIsTransferring(true);
    try {
      let result;
      const amount = Number(debouncedTransferAmount);
      
      if (uiState.opMode === 'goals') {
        if (!formState.newGoalName || !formState.newGoalTarget) {
          throw new Error("Please complete all goal profile fields");
        }
        result = await createChildGoal(uiState.selectedChildId, {
          name: formState.newGoalName,
          targetAmount: Number(formState.newGoalTarget),
          emoji: '💰'
        });
      } else if (uiState.opMode === 'invest') {
        if (!amount) throw new Error("Please specify allocation amount");
        const strategy = actualStrategies.find(s => s.id === uiState.selectedStrategyId);
        result = await investForChild(uiState.selectedChildId, amount, strategy?.name || 'Balanced Portfolio', uiState.isProposeMode);
      } else {
        // Transfer or Savings
        if (!amount) throw new Error("Please specify provision amount");
        if (uiState.selectedGoalId === 'wallet') {
          result = await sendAllowance(uiState.selectedChildId, amount, "Family Allowance", uiState.isProposeMode);
        } else {
          result = await fundChildGoal(uiState.selectedChildId, uiState.selectedGoalId, amount);
        }
      }

      if (result?.success) {
        setFormState({ transferAmount: '', newGoalName: '', newGoalTarget: '' });
        // Refresh goals if we added a new one
        if (uiState.opMode === 'goals') fetchChildGoals(uiState.selectedChildId);
      } else {
        throw new Error(result?.error || "Operation failed");
      }
    } catch (err) {
      console.error('Operation failed:', err);
      alert(err.message);
    } finally {
      setIsTransferring(false);
    }
  }, [uiState.selectedChildId, uiState.opMode, uiState.selectedGoalId, uiState.selectedStrategyId, debouncedTransferAmount, formState, actualStrategies, investForChild, sendAllowance, fundChildGoal, createChildGoal, fetchChildGoals]);

  const handleRemoveMember = useCallback(async (e, childId, name) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove ${name} from your family node?`)) return;
    const result = await removeMember(childId);
    if (result.success) {
      if (uiState.selectedChild?.id === childId) setUiState(prev => ({ ...prev, selectedChild: null }));
    } else alert(result.error || "Failed to remove member");
  }, [removeMember, uiState.selectedChild]);

  const handleTabChangeLocal = useCallback((tabId) => {
    setUiState(prev => ({ ...prev, activeTopTab: tabId }));
    if (tabId === 'credit') onOpenCredit?.();
    if (onTabChange) onTabChange(tabId);
  }, [onOpenCredit, onTabChange]);

  const actionButtons = useMemo(() => [
    { label: "Send Money", icon: Wallet, onClick: () => setUiState(prev => ({ ...prev, opMode: 'transfer' })), active: uiState.opMode === 'transfer' },
    { label: "To Savings", icon: PlusCircle, onClick: () => setUiState(prev => ({ ...prev, opMode: 'savings' })), active: uiState.opMode === 'savings' },
    { label: "Invest", icon: TrendingUp, onClick: () => setUiState(prev => ({ ...prev, opMode: 'invest' })), active: uiState.opMode === 'invest' },
    { label: "Goals", icon: Target, onClick: () => setUiState(prev => ({ ...prev, opMode: 'goals' })), active: uiState.opMode === 'goals' },
    { label: "History", icon: History, onClick: () => setUiState(prev => ({ ...prev, isLedgerModalOpen: true })), active: false },
  ], [uiState.opMode]);

  if (strategiesError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <p className="text-red-600 mb-4">Error loading investment strategies</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout 
      activeTab="home"
      onTabChange={onTabChange}
      onWithdraw={() => {}}
      onShowComingSoon={() => {}}
      modal={null}
      onCloseModal={() => {}}
    >
      <div 
        className="min-h-screen pb-20 text-slate-900 relative overflow-x-hidden font-sans"
        style={{
          backgroundColor: '#f8f6fa',
          backgroundImage: 'linear-gradient(180deg, #0d0d12 0%, #0e0a14 0.5%, #100b18 1%, #120c1c 1.5%, #150e22 2%, #181028 2.5%, #1c122f 3%, #201436 3.5%, #25173e 4%, #2a1a46 5%, #301d4f 6%, #362158 7%, #3d2561 8%, #44296b 9%, #4c2e75 10%, #54337f 11%, #5d3889 12%, #663e93 13%, #70449d 14%, #7a4aa7 15%, #8451b0 16%, #8e58b9 17%, #9860c1 18%, #a268c8 19%, #ac71ce 20%, #b57ad3 21%, #be84d8 22%, #c68edc 23%, #cd98e0 24%, #d4a2e3 25%, #daace6 26%, #dfb6e9 27%, #e4c0eb 28%, #e8c9ed 29%, #ecd2ef 30%, #efdaf1 31%, #f2e1f3 32%, #f4e7f5 33%, #f6ecf7 34%, #f8f0f9 35%, #f9f3fa 36%, #faf5fb 38%, #fbf7fc 40%, #fcf9fd 42%, #fdfafd 45%, #faf8fc 55%, #f8f6fa 100%)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100vh',
        }}
      >
        {/* Top Navigation */}
        <div className="rounded-b-[36px] bg-transparent px-4 pb-12 pt-12 text-white md:px-8">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-6 md:max-w-md">
            <header className="relative flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="h-10 w-10 rounded-full border border-white/40 object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 border border-white/30 text-xs font-semibold text-white">{initials}</div>
                )}
              </div>
              <NavigationPill activeTab={uiState.activeTopTab} onTabChange={handleTabChangeLocal} />
              <NotificationBell onClick={onOpenNotifications || (() => {})} />
            </header>

            <AnimatePresence mode="wait">
              {selectedChild ? (
                <ChildProfileHero 
                  member={selectedChild}
                  parentName={displayName}
                  formatCurrency={formatCurrency}
                  onApprove={approveTransaction}
                  onReject={rejectTransaction}
                  transactions={transactions}
                />
              ) : (
                <div className="relative overflow-hidden rounded-[32px] p-8 shadow-2xl transition-all border border-white/5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(88,62,186,0.45),rgba(8,8,48,0.95)_46%,rgba(5,5,33,0.98)_100%)]" />
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300/60 ">Total Family Net Worth</p>
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={12} className="text-emerald-400" />
                           <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Secured Node</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                        <Users size={18} className="text-white/60" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-[42px] font-black text-white leading-none tracking-tighter">{formatCurrency(totalNetWorth)}</h2>
                      <div className="mt-3 flex items-center gap-3">
                         <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Active Portfolio Management</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto -mt-10 flex w-full max-w-sm flex-col gap-6 px-4 pb-10 md:max-w-md md:px-8">
          <section className="grid grid-cols-4 gap-3 text-[11px] font-medium">
            {actionButtons.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-3 shadow-md transition-all active:scale-95 ${item.active ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                  type="button"
                  onClick={item.onClick}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${item.active ? 'bg-white/10 text-white' : 'bg-violet-50 text-violet-700'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-center leading-tight">{item.label}</span>
                </button>
              );
            })}
          </section>

          {/* Members List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Users size={16} className="text-violet-500" />Linked Core Accounts</h3>
              <button onClick={() => setUiState(prev => ({ ...prev, isAddModalOpen: true }))} className="text-[10px] font-black text-violet-600 uppercase tracking-widest"><Plus size={12} /> Link Member</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {members.map(child => (
                <FamilyMemberCard
                  key={child.id}
                  member={child}
                  isSelected={uiState.selectedChildId === child.id}
                  onSelect={() => setUiState(prev => ({ ...prev, selectedChildId: child.id }))}
                  onRemove={handleRemoveMember}
                  formatCurrency={formatCurrency}
                  parentName={profile?.firstName}
                />
              ))}
            </div>
          </section>

          <AnimatePresence mode="wait">
            {selectedChild && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-4">
                <div className="bg-white/60 backdrop-blur-xl rounded-[36px] shadow-sm border border-white/30 p-6 space-y-6">
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-[28px] overflow-x-auto no-scrollbar">
                    <button onClick={() => setUiState(prev => ({ ...prev, opMode: 'transfer' }))} className={`flex-1 min-w-[80px] py-3 rounded-[24px] text-[9px] font-black uppercase tracking-widest transition-all ${uiState.opMode === 'transfer' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>Transfer</button>
                    <button onClick={() => setUiState(prev => ({ ...prev, opMode: 'savings' }))} className={`flex-1 min-w-[80px] py-3 rounded-[24px] text-[9px] font-black uppercase tracking-widest transition-all ${uiState.opMode === 'savings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>Savings</button>
                    <button onClick={() => setUiState(prev => ({ ...prev, opMode: 'invest' }))} className={`flex-1 min-w-[80px] py-3 rounded-[24px] text-[9px] font-black uppercase tracking-widest transition-all ${uiState.opMode === 'invest' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>Invest</button>
                    <button onClick={() => setUiState(prev => ({ ...prev, opMode: 'goals' }))} className={`flex-1 min-w-[80px] py-3 rounded-[24px] text-[9px] font-black uppercase tracking-widest transition-all ${uiState.opMode === 'goals' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}>Goals</button>
                  </div>
                  
                  <div className="space-y-6">
                    {uiState.opMode === 'goals' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Goal Identity</label>
                          <input 
                            type="text"
                            placeholder="e.g. Tertiary Education"
                            value={formState.newGoalName}
                            onChange={(e) => setFormState(prev => ({ ...prev, newGoalName: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-violet-500/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Target Liquidity (R)</label>
                          <input 
                            type="number"
                            placeholder="250000"
                            value={formState.newGoalTarget}
                            onChange={(e) => setFormState(prev => ({ ...prev, newGoalTarget: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-violet-500/20"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {uiState.opMode === 'savings' && goals.length > 0 && (
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Destination Treasury</label>
                             <select 
                               value={uiState.selectedGoalId} 
                               onChange={(e) => setUiState(prev => ({ ...prev, selectedGoalId: e.target.value }))}
                               className="w-full bg-slate-50 border border-slate-100 rounded-[28px] py-4 px-6 text-sm font-bold text-slate-900 outline-none appearance-none"
                             >
                               <option value="wallet">Direct Wallet</option>
                               {goals.map(g => (
                                 <option key={g.id} value={g.id}>{g.emoji} {g.name} ({formatCurrency(g.current_amount)})</option>
                               ))}
                             </select>
                          </div>
                        )}

                        {uiState.opMode === 'invest' && (
                          <div className="space-y-2">
                             <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Active Multi-Asset Strategy</label>
                             <select 
                               value={uiState.selectedStrategyId} 
                               onChange={(e) => setUiState(prev => ({ ...prev, selectedStrategyId: e.target.value }))}
                               className="w-full bg-slate-50 border border-slate-100 rounded-[28px] py-4 px-6 text-sm font-bold text-slate-900 outline-none appearance-none"
                             >
                               {actualStrategies.map(s => (
                                 <option key={s.id} value={s.id}>{s.name}</option>
                               ))}
                             </select>
                          </div>
                        )}

                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">R</span>
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={formState.transferAmount}
                            onChange={(e) => setFormState(prev => ({ ...prev, transferAmount: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-100 rounded-[28px] py-8 pl-14 pr-6 text-4xl font-black text-slate-900"
                          />
                        </div>
                      </>
                    )}

                    {/* Propose Toggle (Simulate Child Request) */}
                    <div className="flex items-center justify-between px-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Propose as Request</span>
                       <button 
                         onClick={() => setUiState(prev => ({ ...prev, isProposeMode: !prev.isProposeMode }))}
                         className={`w-12 h-6 rounded-full p-1 transition-all ${uiState.isProposeMode ? 'bg-amber-400' : 'bg-slate-200'}`}
                       >
                         <motion.div 
                           animate={{ x: uiState.isProposeMode ? 24 : 0 }}
                           className="w-4 h-4 bg-white rounded-full shadow-sm"
                         />
                       </button>
                    </div>

                    <button 
                      onClick={handleExecuteOperation} 
                      disabled={isTransferring} 
                      className="w-full py-6 rounded-[28px] font-black text-[11px] tracking-[0.2em] uppercase bg-slate-900 text-white shadow-2xl flex items-center justify-center gap-3 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isTransferring ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                        <span>
                           {uiState.opMode === 'transfer' && "Confirm Provision"}
                           {uiState.opMode === 'savings' && "Fund Savings Goal"}
                           {uiState.opMode === 'invest' && "Commit Allocation"}
                           {uiState.opMode === 'goals' && "Build Goal Profile"}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><History size={16} className="text-violet-500" />Financial Artifacts</h3>
              <button onClick={() => setUiState(prev => ({ ...prev, isLedgerModalOpen: true }))} className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Audit Full Chain</button>
            </div>
            <div className="bg-white rounded-[40px] overflow-hidden shadow-xl border border-slate-100 divide-y divide-slate-50">
              {transactions.slice(0, 5).map(tx => (
                <TransactionItem key={tx.id} transaction={tx} formatCurrency={formatCurrency} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <AddMemberModal isOpen={uiState.isAddModalOpen} onClose={() => setUiState(prev => ({ ...prev, isAddModalOpen: false }))} />
      
      <AnimatePresence>
        {uiState.isLedgerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setUiState(prev => ({ ...prev, isLedgerModalOpen: false }))} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tighter">Full Chain Audit</h3>
                <button onClick={() => setUiState(prev => ({ ...prev, isLedgerModalOpen: false }))} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                {transactions.map(tx => (
                  <TransactionItem key={tx.id} transaction={tx} formatCurrency={formatCurrency} />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default FamilyPage;
