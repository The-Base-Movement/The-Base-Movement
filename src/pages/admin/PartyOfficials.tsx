import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { contentService } from '@/services/contentService';
import { toast } from 'sonner';

interface PartyOfficial {
  id: string;
  name: string;
  role: string;
  tier: string;
  region?: string;
  bio?: string;
  avatar_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  email?: string;
  order_index: number;
}

interface PartyTier {
  id: string;
  name: string;
  title: string;
  description: string;
  order_index: number;
}

export default function PartyOfficials() {
  const [officials, setOfficials] = useState<PartyOfficial[]>([]);
  const [tiers, setTiers] = useState<PartyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTiersModalOpen, setIsTiersModalOpen] = useState(false);
  const [tierFormData, setTierFormData] = useState<Partial<PartyTier>>({ name: '', title: '', description: '', order_index: 0 });
  const [editingTierId, setEditingTierId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<PartyOfficial>>({
    name: '', role: '', tier: '', region: '', bio: '', avatar_url: '', facebook_url: '', instagram_url: '', twitter_url: '', linkedin_url: '', email: '', order_index: 0
  });

  async function fetchOfficials() {
    const { data, error } = await supabase
      .from('party_officials')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to load officials');
    } else {
      setOfficials(data || []);
    }
    setLoading(false);
  }

  async function fetchTiers() {
    const { data } = await supabase.from('party_tiers').select('*').order('order_index', { ascending: true });
    if (data) setTiers(data);
  }

  useEffect(() => {
    fetchTiers();
    fetchOfficials();
  }, []);

  const handleOpenModal = (official?: PartyOfficial) => {
    if (official) {
      setFormData(official);
      setIsEditing(true);
    } else {
      setFormData({ name: '', role: '', tier: '', region: '', bio: '', avatar_url: '', facebook_url: '', instagram_url: '', twitter_url: '', linkedin_url: '', email: '', order_index: 0 });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await contentService.uploadImage(file, 'party-officials');
      if (url) {
        setFormData(prev => ({ ...prev, avatar_url: url }));
        toast.success('Image uploaded to media library');
      } else {
        toast.error('Upload failed');
      }
    } catch {
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this official?')) return;
    const { error } = await supabase.from('party_officials').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete official');
    } else {
      toast.success('Official deleted successfully');
      fetchOfficials();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) {
      toast.error('Name and role are required');
      return;
    }

    if (isEditing && formData.id) {
      const { error } = await supabase.from('party_officials').update({
        name: formData.name,
        role: formData.role,
        tier: formData.tier,
        region: formData.region || null,
        bio: formData.bio || null,
        avatar_url: formData.avatar_url || null,
        twitter_url: formData.twitter_url || null,
        linkedin_url: formData.linkedin_url || null,
        email: formData.email || null,
        order_index: formData.order_index
      }).eq('id', formData.id);

      if (error) {
        toast.error('Failed to update official');
      } else {
        toast.success('Official updated');
        setIsModalOpen(false);
        fetchOfficials();
      }
    } else {
      const { error } = await supabase.from('party_officials').insert([{
        name: formData.name,
        role: formData.role,
        tier: formData.tier,
        region: formData.region || null,
        bio: formData.bio || null,
        avatar_url: formData.avatar_url || null,
        facebook_url: formData.facebook_url || null,
        instagram_url: formData.instagram_url || null,
        twitter_url: formData.twitter_url || null,
        linkedin_url: formData.linkedin_url || null,
        email: formData.email || null,
        order_index: formData.order_index || 0
      }]);

      if (error) {
        toast.error('Failed to create official');
      } else {
        toast.success('Official created');
        setIsModalOpen(false);
        fetchOfficials();
      }
    }
  };

  const inputSt: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 12px', border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--container-low))', outline: 'none', fontFamily: "'Public Sans', sans-serif",
    fontWeight: 700, fontSize: 12, borderRadius: 4, boxSizing: 'border-box', color: 'hsl(var(--on-surface))'
  };

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="top" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
        <div>
          <div className="crumbs">Personnel · Leadership</div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>badge</span>
            Party Officials
          </h2>
        </div>
        <div className="actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setIsTiersModalOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>layers</span>
            Manage Tiers
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Add Official
          </button>
        </div>
      </div>

      <div className="panel" style={{ overflow: 'visible' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '11px 20px', textAlign: 'left', fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', borderBottom: '1px solid hsl(var(--border))' }}>Name</th>
                <th style={{ padding: '11px 20px', textAlign: 'left', fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', borderBottom: '1px solid hsl(var(--border))' }}>Role</th>
                <th style={{ padding: '11px 20px', textAlign: 'left', fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', borderBottom: '1px solid hsl(var(--border))' }}>Tier</th>
                <th style={{ padding: '11px 20px', textAlign: 'right', fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))', borderBottom: '1px solid hsl(var(--border))' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center' }}>Loading...</td></tr>
              ) : officials.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center' }}>No officials found.</td></tr>
              ) : (
                officials.map(official => (
                  <tr key={official.id}>
                    <td style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'hsl(var(--container-low))', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <img src={official.avatar_url || '/officer-placeholder.png'} alt={official.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        {official.name}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
                      {official.role} <br />
                      <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{official.region}</span>
                    </td>
                    <td style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
                      <span style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 800, color: 'hsl(var(--primary))' }}>
                        {tiers.find(t => t.name === official.tier)?.title || official.tier}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', textAlign: 'right' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => handleOpenModal(official)} style={{ marginRight: 8 }}>Edit</button>
                      <button className="btn btn-sm btn-outline" style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive))' }} onClick={() => handleDelete(official.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', padding: '40px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 4, width: '100%', maxWidth: 900, margin: 'auto', flexShrink: 0, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--on-surface))' }}>
              <div>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>{isEditing ? 'Edit Official' : 'Add Official'}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', padding: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
              </button>
            </div>
            <div style={{ padding: 24 }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
                {/* Column 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label htmlFor="official-name" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Name</label>
                    <input id="official-name" name="name" required style={inputSt} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="official-role" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Role</label>
                    <input id="official-role" name="role" required style={inputSt} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="official-tier" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Tier</label>
                    <select id="official-tier" name="tier" required style={{ ...inputSt, padding: '0 8px' }} value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})}>
                      <option value="" disabled>Select a tier</option>
                      {tiers.map(t => (
                        <option key={t.id} value={t.name}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="official-region" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Region (Optional)</label>
                    <input id="official-region" name="region" style={inputSt} value={formData.region || ''} onChange={e => setFormData({...formData, region: e.target.value})} />
                  </div>
                </div>

                {/* Column 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="official-bio" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Biography (Optional)</label>
                    <textarea id="official-bio" name="bio" style={{ ...inputSt, flex: 1, minHeight: 120, padding: '12px', resize: 'vertical' }} value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="official-avatar" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Avatar Image</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {formData.avatar_url && (
                        <img src={formData.avatar_url} alt="Preview" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#ccc' }} />
                      )}
                      <input id="official-avatar" name="avatar" type="file" accept="image/*" onChange={handleUploadImage} disabled={isUploading} style={{ fontSize: 12, width: '100%' }} />
                    </div>
                    {isUploading && <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 4, display: 'block' }}>Uploading to media library...</span>}
                  </div>
                </div>

                {/* Column 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label htmlFor="official-facebook" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Facebook URL (Optional)</label>
                    <input id="official-facebook" name="facebook_url" style={inputSt} value={formData.facebook_url || ''} onChange={e => setFormData({...formData, facebook_url: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="official-instagram" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Instagram URL (Optional)</label>
                    <input id="official-instagram" name="instagram_url" style={inputSt} value={formData.instagram_url || ''} onChange={e => setFormData({...formData, instagram_url: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="official-twitter" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Twitter URL (Optional)</label>
                    <input id="official-twitter" name="twitter_url" style={inputSt} value={formData.twitter_url || ''} onChange={e => setFormData({...formData, twitter_url: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="official-linkedin" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>LinkedIn URL (Optional)</label>
                    <input id="official-linkedin" name="linkedin_url" style={inputSt} value={formData.linkedin_url || ''} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="official-email" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Email (Optional)</label>
                    <input id="official-email" name="email" type="email" style={inputSt} value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, borderTop: '1px solid hsl(var(--border))', paddingTop: 20 }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ flex: 1, height: 42 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: 42 }}>{isEditing ? 'Save Changes' : 'Create'}</button>
              </div>
            </form>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isTiersModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', padding: '40px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }} onClick={() => setIsTiersModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 4, width: '100%', maxWidth: 600, margin: 'auto', flexShrink: 0, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--on-surface))' }}>
              <div>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>Manage Party Tiers</p>
              </div>
              <button type="button" onClick={() => setIsTiersModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', padding: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
              </button>
            </div>
            
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Existing Tiers</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tiers.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'hsl(var(--container-low))', borderRadius: 4, border: '1px solid hsl(var(--border))' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>{t.title} <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontWeight: 600 }}>({t.name})</span></div>
                      <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Order: {t.order_index}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => { setTierFormData(t); setEditingTierId(t.id); }}>Edit</button>
                      <button className="btn btn-sm btn-outline" style={{ color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive))' }} onClick={async () => {
                        if (confirm('Are you sure you want to delete this tier?')) {
                          await supabase.from('party_tiers').delete().eq('id', t.id);
                          fetchTiers();
                        }
                      }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, borderTop: '1px solid hsl(var(--border))', paddingTop: 20 }}>{editingTierId ? 'Edit Tier' : 'Create New Tier'}</h4>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (editingTierId) {
                await supabase.from('party_tiers').update(tierFormData).eq('id', editingTierId);
                toast.success('Tier updated');
              } else {
                await supabase.from('party_tiers').insert([tierFormData]);
                toast.success('Tier created');
              }
              setTierFormData({ name: '', title: '', description: '', order_index: 0 });
              setEditingTierId(null);
              fetchTiers();
            }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label htmlFor="tier-name" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Internal Name (e.g. executive)</label>
                  <input id="tier-name" name="name" required style={inputSt} value={tierFormData.name} onChange={e => setTierFormData({...tierFormData, name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})} disabled={!!editingTierId} />
                </div>
                <div>
                  <label htmlFor="tier-title" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Display Title</label>
                  <input id="tier-title" name="title" required style={inputSt} value={tierFormData.title} onChange={e => setTierFormData({...tierFormData, title: e.target.value})} />
                </div>
              </div>
              <div>
                <label htmlFor="tier-description" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Description</label>
                <textarea id="tier-description" name="description" style={{ ...inputSt, height: 60, padding: '8px 12px', resize: 'vertical' }} value={tierFormData.description || ''} onChange={e => setTierFormData({...tierFormData, description: e.target.value})} />
              </div>
              <div>
                <label htmlFor="tier-order" style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Order Index (lower = higher up)</label>
                <input id="tier-order" name="order_index" required type="number" style={inputSt} value={tierFormData.order_index} onChange={e => setTierFormData({...tierFormData, order_index: parseInt(e.target.value) || 0})} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                {editingTierId && <button type="button" className="btn btn-outline" onClick={() => { setTierFormData({ name: '', title: '', description: '', order_index: 0 }); setEditingTierId(null); }} style={{ flex: 1, height: 42 }}>Cancel Edit</button>}
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: 42 }}>{editingTierId ? 'Save Tier' : 'Create Tier'}</button>
              </div>
            </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
