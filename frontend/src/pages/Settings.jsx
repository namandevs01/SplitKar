import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Lock, Bell, Shield, LogOut } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../context/authStore';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const { register: reg1, handleSubmit: submit1 } = useForm({ defaultValues: { name: user?.name, phone: user?.phone } });
  const { register: reg2, handleSubmit: submit2, reset: reset2 } = useForm();

  const onUpdateProfile = async (data) => {
    setSaving(true);
    try {
      const res = await api.put('/auth/me', data);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); } finally { setSaving(false); }
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) return toast.error('Passwords do not match');
    setChangingPwd(true);
    try {
      await api.put('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed!');
      reset2();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setChangingPwd(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const Section = ({ icon: Icon, title, children }) => (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
          <Icon size={18} />
        </div>
        <h2 className="section-title">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <Section icon={User} title="Profile">
        <form onSubmit={submit1(onUpdateProfile)} className="space-y-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{user?.name}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" {...reg1('name')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <div className="flex gap-2">
                <span className="input w-12 text-center shrink-0 text-slate-400 text-sm">+91</span>
                <input className="input" {...reg1('phone')} />
              </div>
            </div>
          </div>
          <div>
            <label className="label">UPI ID <span className="text-slate-600 font-normal">(for receiving payments)</span></label>
            <input className="input" placeholder="yourname@upi" {...reg1('upiId')} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </Section>

      {/* Password */}
      <Section icon={Lock} title="Change Password">
        <form onSubmit={submit2(onChangePassword)} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input className="input" type="password" placeholder="••••••••" {...reg2('currentPassword', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" placeholder="••••••••" {...reg2('newPassword', { required: true, minLength: 6 })} />
            </div>
            <div>
              <label className="label">Confirm new</label>
              <input className="input" type="password" placeholder="••••••••" {...reg2('confirmPassword', { required: true })} />
            </div>
          </div>
          <button type="submit" disabled={changingPwd} className="btn-primary">{changingPwd ? 'Updating...' : 'Update Password'}</button>
        </form>
      </Section>

      {/* Account */}
      <Section icon={Shield} title="Account">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
            <div>
              <p className="text-sm text-white">Auth provider</p>
              <p className="text-xs text-slate-500 capitalize">{user?.authProvider || 'local'}</p>
            </div>
            <span className="badge-green capitalize">{user?.authProvider || 'email'}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
            <div>
              <p className="text-sm text-white">Verification status</p>
              <p className="text-xs text-slate-500">Email & phone verification</p>
            </div>
            <span className={user?.isVerified ? 'badge-green' : 'badge-yellow'}>{user?.isVerified ? 'Verified' : 'Pending'}</span>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-all text-sm font-medium">
            <LogOut size={16} /> Sign out of SplitKar
          </button>
        </div>
      </Section>
    </div>
  );
}
