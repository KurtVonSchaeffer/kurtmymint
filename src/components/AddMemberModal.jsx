import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Baby, UserPlus, Fingerprint, ShieldCheck, AlertCircle } from 'lucide-react';
import { useFamilyStore } from '../store/useFamilyStore';

// Constants
const GENDERS = [
  { value: 'Boy', label: 'Son', icon: User, color: 'blue' },
  { value: 'Girl', label: 'Daughter', icon: User, color: 'pink' },
  { value: 'Baby', label: 'Infant', icon: Baby, color: 'purple' }
];

const AVATAR_COLORS = [
  'bg-red-100 text-red-600',
  'bg-blue-100 text-blue-600',
  'bg-green-100 text-green-600',
  'bg-yellow-100 text-yellow-600',
  'bg-purple-100 text-purple-600',
  'bg-pink-100 text-pink-600',
  'bg-indigo-100 text-indigo-600',
  'bg-orange-100 text-orange-600'
];

/**
 * AddMemberModal
 * Enhanced modal for adding family members with surname support and validation.
 */
const AddMemberModal = ({ isOpen, onClose }) => {
  const { addMember, isDemoMode } = useFamilyStore();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Boy',
    idNumber: '',
    dateOfBirth: '',
    avatarColor: AVATAR_COLORS[0]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [touched, setTouched] = useState({});

  // Validation helper
  const validateForm = useCallback(() => {
    const validationErrors = [];
    
    // First name validation
    if (!formData.firstName.trim()) {
      validationErrors.push({ field: 'firstName', message: 'First name is required' });
    } else if (formData.firstName.length < 2) {
      validationErrors.push({ field: 'firstName', message: 'First name must be at least 2 characters' });
    } else if (formData.firstName.length > 50) {
      validationErrors.push({ field: 'firstName', message: 'First name must be less than 50 characters' });
    } else if (!/^[a-zA-Z\s\-']+$/.test(formData.firstName)) {
      validationErrors.push({ field: 'firstName', message: 'First name can only contain letters, spaces, hyphens, and apostrophes' });
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      validationErrors.push({ field: 'lastName', message: 'Last name is required' });
    } else if (formData.lastName.length < 2) {
      validationErrors.push({ field: 'lastName', message: 'Last name must be at least 2 characters' });
    } else if (formData.lastName.length > 50) {
      validationErrors.push({ field: 'lastName', message: 'Last name must be less than 50 characters' });
    } else if (!/^[a-zA-Z\s\-']+$/.test(formData.lastName)) {
      validationErrors.push({ field: 'lastName', message: 'Last name can only contain letters, spaces, hyphens, and apostrophes' });
    }
    
    // ID number validation (RSA ID - 13 digits)
    if (formData.idNumber && formData.idNumber.length > 0) {
      if (!/^\d{13}$/.test(formData.idNumber)) {
        validationErrors.push({ field: 'idNumber', message: 'RSA ID number must be exactly 13 digits' });
      } else {
        // South African ID number validation
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          const digit = parseInt(formData.idNumber[i]);
          if (i % 2 === 0) {
            sum += digit;
          } else {
            const doubled = digit * 2;
            sum += Math.floor(doubled / 10) + (doubled % 10);
          }
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        if (parseInt(formData.idNumber[12]) !== checkDigit) {
          validationErrors.push({ field: 'idNumber', message: 'Invalid RSA ID number checksum' });
        }
      }
    }
    
    // Date of birth validation
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      
      if (isNaN(dob.getTime())) {
        validationErrors.push({ field: 'dateOfBirth', message: 'Invalid date format' });
      } else if (age > 18) {
        validationErrors.push({ field: 'dateOfBirth', message: 'Member must be under 18 years old' });
      } else if (age < 0) {
        validationErrors.push({ field: 'dateOfBirth', message: 'Date of birth cannot be in the future' });
      }
    }
    
    return validationErrors;
  }, [formData]);

  // Real-time validation on field blur
  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const validationErrors = validateForm();
    setErrors(validationErrors);
  }, [validateForm]);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setTouched({
        firstName: true,
        lastName: true,
        gender: true,
        idNumber: true,
        dateOfBirth: true
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const result = await addMember({
      first_name: formData.firstName,
      last_name: formData.lastName,
      gender: formData.gender,
      id_number: formData.idNumber || null,
      date_of_birth: formData.dateOfBirth || null,
      avatar_color: formData.avatarColor,
      available_balance: 0,
      created_at: new Date().toISOString()
    });
    
    if (result.success) {
      setFormData({
        firstName: '',
        lastName: '',
        gender: 'Boy',
        idNumber: '',
        dateOfBirth: '',
        avatarColor: AVATAR_COLORS[0]
      });
      setErrors([]);
      setTouched({});
      onClose();
    } else {
      setErrors([{ field: 'general', message: result.error || 'Failed to add member' }]);
    }
    
    setIsSubmitting(false);
  }, [formData, addMember, onClose, validateForm]);

  const getFieldError = useCallback((field) => {
    if (!touched[field]) return undefined;
    return errors.find(e => e.field === field)?.message;
  }, [errors, touched]);

  const randomAvatarColor = useMemo(() => {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[500px] bg-white rounded-[48px] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-3xl ${randomAvatarColor} shadow-sm transition-all`}>
                    <UserPlus size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">Add Family Member</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Connect Digital Wallet</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-2xl bg-slate-50 p-3 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        onBlur={() => handleBlur('firstName')}
                        className={`w-full rounded-[24px] border bg-slate-50 py-4 pl-12 pr-5 text-slate-900 font-medium placeholder-slate-300 outline-none transition-all focus:ring-4 shadow-sm
                          ${getFieldError('firstName') 
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' 
                            : 'border-slate-100 focus:border-violet-600/20 focus:ring-violet-600/5 focus:bg-white'}`}
                        placeholder="Kyle"
                      />
                    </div>
                    {getFieldError('firstName') && (
                      <p id="firstName-error" className="text-[10px] font-bold text-rose-500 ml-4 flex items-center gap-1">
                        <AlertCircle size={10} /> {getFieldError('firstName')}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Surname <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        onBlur={() => handleBlur('lastName')}
                        className={`w-full rounded-[24px] border bg-slate-50 py-4 pl-12 pr-5 text-slate-900 font-medium placeholder-slate-300 outline-none transition-all focus:ring-4 shadow-sm
                          ${getFieldError('lastName') 
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' 
                            : 'border-slate-100 focus:border-violet-600/20 focus:ring-violet-600/5 focus:bg-white'}`}
                        placeholder="Thompson"
                      />
                    </div>
                    {getFieldError('lastName') && (
                      <p id="lastName-error" className="text-[10px] font-bold text-rose-500 ml-4 flex items-center gap-1">
                        <AlertCircle size={10} /> {getFieldError('lastName')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {GENDERS.map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: value })}
                        className={`flex flex-col items-center justify-center gap-2 rounded-[24px] border py-4 transition-all active:scale-95
                          ${formData.gender === value
                            ? `border-${color === 'blue' ? 'violet' : color === 'pink' ? 'pink' : 'purple'}-600 bg-${color === 'blue' ? 'violet' : color === 'pink' ? 'pink' : 'purple'}-600 text-white shadow-lg`
                            : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-violet-200 hover:text-violet-600'}`}
                      >
                        <div className="p-1">
                          <Icon size={20} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    RSA ID Number (Optional)
                  </label>
                  <div className="relative">
                    <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value.replace(/\D/g, '') })}
                      onBlur={() => handleBlur('idNumber')}
                      className={`w-full rounded-[24px] border bg-slate-50 py-4 pl-12 pr-5 text-slate-900 font-medium placeholder-slate-300 outline-none transition-all focus:ring-4 shadow-sm font-mono
                        ${getFieldError('idNumber') 
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' 
                          : 'border-slate-100 focus:border-violet-600/20 focus:ring-violet-600/5 focus:bg-white'}`}
                      placeholder="13 digits"
                      maxLength={13}
                    />
                  </div>
                  {getFieldError('idNumber') && (
                    <p className="text-[10px] font-bold text-rose-500 ml-4">{getFieldError('idNumber')}</p>
                  )}
                </div>

                {/* Preview Card */}
                {(formData.firstName || formData.lastName) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-[24px] border border-slate-100"
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Card Preview</p>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${formData.gender === 'Girl' ? 'bg-pink-100 text-pink-600' : formData.gender === 'Boy' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'} flex items-center justify-center text-lg font-bold shadow-sm`}>
                        {formData.firstName?.[0] || '👤'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {formData.firstName || 'First'} {formData.lastName || 'Last'}
                        </p>
                        <p className="text-[10px] text-slate-500">R 0.00 available</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full rounded-[32px] bg-gradient-to-br from-violet-600 to-purple-500 py-5 font-black text-white text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-violet-200 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                >
                  {isSubmitting ? (
                    <div className="mx-auto h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Initialize Growth Profile'
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Secured & Encrypted Protocol
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddMemberModal;
