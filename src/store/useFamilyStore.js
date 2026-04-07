import { create } from 'zustand';
import { supabase } from '../lib/supabase';

/**
 * useFamilyStore
 * Clean, production-ready store for the Family Hub.
 * Uses direct Supabase client queries with NO placeholders or demo fallbacks.
 */
export const useFamilyStore = create((set, get) => ({
  // State
  members: [],
  parentBalance: 0,
  childrenTotal: 0,
  totalNetWorth: 0,
  goals: [],
  transactions: [],
  loading: false,
  error: null,

  // Core Actions
  fetchFamilyData: async () => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 1. Fetch Net Worth via RPC
      const { data: netWorthData, error: netWorthError } = await supabase
        .rpc('calculate_family_net_worth', { p_parent_id: user.id });

      if (netWorthError) throw netWorthError;

      // 2. Fetch Members
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('parent_id', user.id)
        .order('first_name');

      if (membersError) throw membersError;

      set({
        members: membersData || [],
        parentBalance: netWorthData.parentBalance || 0,
        childrenTotal: netWorthData.childrenTotal || 0,
        totalNetWorth: netWorthData.totalNetWorth || 0,
        loading: false
      });
    } catch (err) {
      console.error("[FamilyStore] Fetch Error:", err);
      set({ 
        error: err.message, 
        loading: false,
        members: [], // Clear state on error to avoid showing stale/old data
        totalNetWorth: 0 
      });
    }
  },

  fetchFamilyTransactions: async () => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('family_transactions')
        .select(`
          *,
          family_members (
            first_name
          )
        `)
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map child_name from joined member data
      const mappedTransactions = (data || []).map(tx => ({
        ...tx,
        child_name: tx.family_members?.first_name || 'System'
      }));

      set({ transactions: mappedTransactions, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchChildGoals: async (childId) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('member_id', childId)
        .order('created_at');

      if (error) throw error;

      set({ goals: data || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addMember: async (memberData) => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Insert member
      const { data: member, error: memberError } = await supabase
        .from('family_members')
        .insert([{
          parent_id: user.id,
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          gender: memberData.gender,
          id_number: memberData.id_number,
          date_of_birth: memberData.date_of_birth,
          avatar_color: memberData.avatar_color,
          available_balance: 0
        }])
        .select()
        .single();

      if (memberError) throw memberError;

      // Log initialization transaction
      await supabase.from('family_transactions').insert([{
        parent_id: user.id,
        member_id: member.id,
        type: 'member_joined',
        amount: 0,
        description: `Initialized growth profile for ${member.first_name} ${member.last_name || ''}`
      }]);

      await get().fetchFamilyData();
      await get().fetchFamilyTransactions();
      
      set({ loading: false });
      return { success: true, data: member };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  removeMember: async (childId) => {
    set({ loading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', childId);

      if (error) throw error;

      await get().fetchFamilyData();
      set({ loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  sendAllowance: async (childId, amount, description, isProposed = false) => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Record Transaction with appropriate status
      const { data: tx, error: txError } = await supabase.from('family_transactions').insert([{
        parent_id: user.id,
        member_id: childId,
        type: 'allowance',
        amount: amount,
        description: description || 'Family Allowance',
        status: isProposed ? 'pending' : 'completed'
      }]).select().single();

      if (txError) throw txError;

      // 2. Only update balance if NOT proposed
      if (!isProposed) {
        const { data: member } = await supabase.from('family_members').select('available_balance').eq('id', childId).single();
        const newBalance = (member?.available_balance || 0) + amount;

        const { error: updateError } = await supabase
          .from('family_members')
          .update({ available_balance: newBalance })
          .eq('id', childId);

        if (updateError) throw updateError;
      }

      await Promise.all([
        get().fetchFamilyData(),
        get().fetchFamilyTransactions()
      ]);
      
      set({ loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  investForChild: async (childId, amount, strategy, isProposed = false) => {
    set({ loading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Record Investment Transaction
      const { data: tx, error: txError } = await supabase.from('family_transactions').insert([{
        parent_id: user.id,
        member_id: childId,
        type: 'investment',
        amount: amount,
        strategy: strategy,
        description: `Investment Execution: ${strategy}`,
        status: isProposed ? 'pending' : 'completed'
      }]).select().single();

      if (txError) throw txError;

      // 2. Only update balance if NOT proposed
      if (!isProposed) {
        const { data: member } = await supabase.from('family_members').select('available_balance').eq('id', childId).single();
        const newBalance = (member?.available_balance || 0) - amount;

        const { error: updateError } = await supabase
          .from('family_members')
          .update({ available_balance: newBalance })
          .eq('id', childId);

        if (updateError) throw updateError;
      }

      await Promise.all([
        get().fetchFamilyData(),
        get().fetchFamilyTransactions()
      ]);
      
      set({ loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  approveTransaction: async (txId) => {
    set({ loading: true, error: null });
    try {
      // 1. Get transaction details
      const { data: tx, error: fetchError } = await supabase
        .from('family_transactions')
        .select('*')
        .eq('id', txId)
        .single();
      
      if (fetchError) throw fetchError;
      if (tx.status !== 'pending') throw new Error("Transaction is not pending");

      // 2. Update member balance
      const { data: member } = await supabase
        .from('family_members')
        .select('available_balance')
        .eq('id', tx.member_id)
        .single();
      
      let newBalance = member.available_balance;
      if (tx.type === 'allowance') newBalance += tx.amount;
      else if (tx.type === 'investment' || tx.type === 'goal_funding') newBalance -= tx.amount;

      const { error: memberError } = await supabase
        .from('family_members')
        .update({ available_balance: newBalance })
        .eq('id', tx.member_id);
      
      if (memberError) throw memberError;

      // 3. Mark as completed
      const { error: updateError } = await supabase
        .from('family_transactions')
        .update({ status: 'completed' })
        .eq('id', txId);
      
      if (updateError) throw updateError;

      await Promise.all([
        get().fetchFamilyData(),
        get().fetchFamilyTransactions()
      ]);
      
      set({ loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  rejectTransaction: async (txId) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('family_transactions')
        .update({ status: 'rejected' })
        .eq('id', txId);
      
      if (error) throw error;
      await get().fetchFamilyTransactions();
      set({ loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  fundChildGoal: async (childId, goalId, amount) => {
    // Keeping balance logic immediate for goals as they are usually parent-driven
    set({ loading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: goal } = await supabase.from('savings_goals').select('current_amount').eq('id', goalId).single();
      const newGoalAmount = (goal?.current_amount || 0) + amount;

      const { error: goalError } = await supabase
        .from('savings_goals')
        .update({ current_amount: newGoalAmount })
        .eq('id', goalId);

      if (goalError) throw goalError;

      const { error: txError } = await supabase.from('family_transactions').insert([{
        parent_id: user.id,
        member_id: childId,
        type: 'goal_funding',
        amount: amount,
        description: `Goal Funding: Contribution to Savings`,
        status: 'completed'
      }]);

      if (txError) throw txError;

      const { data: member } = await supabase.from('family_members').select('available_balance').eq('id', childId).single();
      const newBalance = (member?.available_balance || 0) - amount;

      const { error: updateError } = await supabase
        .from('family_members')
        .update({ available_balance: newBalance })
        .eq('id', childId);

      if (updateError) throw updateError;

      await Promise.all([
        get().fetchFamilyData(),
        get().fetchFamilyTransactions(),
        get().fetchChildGoals(childId)
      ]);
      
      set({ loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  createChildGoal: async (childId, goalData) => {
    set({ loading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('savings_goals')
        .insert([{
          member_id: childId,
          name: goalData.name,
          target_amount: goalData.targetAmount,
          emoji: goalData.emoji || '💰'
        }]);

      if (error) throw error;

      await get().fetchChildGoals(childId);
      set({ loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  clearError: () => set({ error: null }),
}));

