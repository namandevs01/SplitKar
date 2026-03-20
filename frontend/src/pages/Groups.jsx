import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Users, Plus, X, ArrowRight, Home, Plane, Utensils, PartyPopper, Briefcase, Tag, Trash2 } from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/shared/ConfirmModal';

const CATEGORIES = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'trip', label: 'Trip', icon: Plane },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'event', label: 'Event', icon: PartyPopper },
  { id: 'project', label: 'Project', icon: Briefcase },
  { id: 'other', label: 'Other', icon: Tag },
];

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({ defaultValues: { category: 'other' } });
  const selectedCat = watch('category');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/groups').then((r) => setGroups(r.data.groups || [])).finally(() => setLoading(false));
  }, []);

  const addEmail = () => {
    const e = emailInput.trim().toLowerCase();
    if (!e || !/^\S+@\S+$/.test(e)) return toast.error('Enter a valid email');
    if (emails.includes(e)) return toast.error('Already added');
    setEmails([...emails, e]);
    setEmailInput('');
  };

  const onDeleteGroup = async () => {
    setDeleting(true);
    try {
      await api.delete(`/groups/${deleteTargetId}`);
      toast.success('Group deleted');
      setGroups(groups.filter((g) => g.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const res = await api.post('/groups', { ...data, memberEmails: emails });
      toast.success('Group created!');
      setGroups([res.data.group, ...groups]);
      setShowModal(false);
      reset();
      setEmails([]);
      navigate(`/app/groups/${res.data.group.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally { setSaving(false); }
  };

  return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Groups</h1>
            <p className="text-slate-400 text-sm mt-1">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Group
          </button>
        </div>

        {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
        ) : groups.length === 0 ? (
            <div className="card p-16 text-center">
              <Users size={48} className="text-slate-700 mx-auto mb-4" />
              <h3 className="text-white font-semibold text-lg mb-2">No groups yet</h3>
              <p className="text-slate-400 text-sm mb-6">Create a group to start splitting expenses with friends</p>
              <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus size={16} /> Create first group
              </button>
            </div>
        ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g) => {
                const Cat = CATEGORIES.find((c) => c.id === g.category) || CATEGORIES[5];
                return (
                    <div key={g.id} className="relative group/card h-48">
                      <Link
                          to={`/app/groups/${g.id}`}
                          className="card p-5 hover:border-brand-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/5 group flex flex-col h-full"
                      >
                        {/* Top row — icon, badge, and delete button */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                            <Cat.icon size={22} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="badge-green text-xs transition-all duration-200">{Cat.label}</span>
                            <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDeleteTargetId(g.id);
                                }}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20
                 opacity-0 w-0 overflow-hidden
                 group-hover/card:opacity-100 group-hover/card:w-auto group-hover/card:overflow-visible
                 transition-all duration-200 hover:bg-red-500/20 shrink-0"
                                title="Delete group"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Group name and description */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1 group-hover:text-brand-400 transition-colors">{g.name}</h3>
                          {g.description && (
                              <p className="text-xs text-slate-500 line-clamp-2">{g.description}</p>
                          )}
                        </div>

                        {/* Bottom row — members and arrow */}
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
                    <span className="flex items-center gap-1">
                      <Users size={12} />{g.members?.length || 1} members
                    </span>
                          <ArrowRight size={14} className="text-slate-600 group-hover:text-brand-400 transition-colors" />
                        </div>
                      </Link>
                    </div>
                );
              })}

              {/* New group card */}
              <button
                  onClick={() => setShowModal(true)}
                  className="card p-5 border-dashed border-white/10 hover:border-brand-500/30 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-brand-400 transition-all h-48"
              >
                <Plus size={24} />
                <span className="text-sm font-medium">New Group</span>
              </button>
            </div>
        )}

        {/* Create Group Modal */}
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
              <div className="relative card p-6 w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="section-title">Create New Group</h2>
                  <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="label">Group name</label>
                    <input className="input" placeholder="Weekend trip to Goa"
                           {...register('name', { required: 'Group name is required' })} />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Description <span className="text-slate-600 font-normal">(optional)</span></label>
                    <textarea className="input resize-none" rows={2} placeholder="What's this group for?"
                              {...register('description')} />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(({ id, label, icon: Icon }) => (
                          <button key={id} type="button" onClick={() => setValue('category', id)}
                                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all
                        ${selectedCat === id ? 'border-brand-500 bg-brand-500/15 text-brand-400' : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}>
                            <Icon size={18} />{label}
                          </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Invite members by email</label>
                    <div className="flex gap-2">
                      <input className="input" placeholder="friend@email.com" value={emailInput}
                             onChange={(e) => setEmailInput(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())} />
                      <button type="button" onClick={addEmail} className="btn-secondary px-3 shrink-0"><Plus size={16} /></button>
                    </div>
                    {emails.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {emails.map((e) => (
                              <span key={e} className="badge-green flex items-center gap-1.5 text-xs">
                        {e}
                                <button type="button" onClick={() => setEmails(emails.filter((x) => x !== e))}><X size={11} /></button>
                      </span>
                          ))}
                        </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={saving} className="btn-primary flex-1">
                      {saving ? 'Creating...' : 'Create Group'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* Delete Confirm Modal */}
        <ConfirmModal
            isOpen={!!deleteTargetId}
            onClose={() => setDeleteTargetId(null)}
            onConfirm={onDeleteGroup}
            loading={deleting}
            title="Delete Group"
            message="Are you sure you want to delete this group? All expenses and settlements will be permanently removed."
            confirmLabel="Delete Group"
            danger
        />
      </div>
  );
}