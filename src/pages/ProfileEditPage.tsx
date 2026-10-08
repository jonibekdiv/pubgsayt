import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Camera, Check, Globe, Instagram, MessageCircle, Music, Save,
  Trash2, Twitch, Youtube, User as UserIcon, Trophy, MapPin,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { RequireAuth } from '@/components/common/require-auth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { userApi } from '@/services/api';
import { compressImage, PRESETS, formatBytes } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

const SOCIALS = [
  { key: 'telegram', label: 'Telegram', icon: MessageCircle, placeholder: 'https://t.me/username' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@channel' },
  { key: 'tiktok', label: 'TikTok', icon: Music, placeholder: 'https://tiktok.com/@username' },
  { key: 'discord', label: 'Discord', icon: MessageCircle, placeholder: 'username#1234' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://example.com' },
] as const;

type SocialKey = typeof SOCIALS[number]['key'];

export function ProfileEditPage() {
  return (
    <RequireAuth>
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
    country: user?.country ?? '',
    city: user?.city ?? '',
    pubgNickname: user?.pubgNickname ?? '',
    pubgId: user?.pubgId ?? '',
    bio: user?.bio ?? '',
    experienceYears: user?.experienceYears ?? 0,
    favoriteMap: user?.favoriteMap ?? '',
    avatar: user?.avatar ?? '',
    socials: { ...(user?.socials ?? {}) } as Record<string, string>,
  });

  if (!user) return null;

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const setSocial = (key: SocialKey, value: string) =>
    setForm(prev => ({ ...prev, socials: { ...prev.socials, [key]: value } }));

   const handleFile = async (file: File) => {
    if (!ALLOWED.includes(file.type)) {
      toast('ERROR', 'Invalid file type', 'Only PNG, JPG, WEBP, GIF allowed');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast('ERROR', 'File too large', 'Maximum ' + formatBytes(MAX_AVATAR_BYTES));
      return;
    }
    setUploading(true);
    try {
      const result = await compressImage(file, PRESETS.avatar);
      set('avatar', result.dataUrl);
      const saved = ((1 - result.ratio) * 100).toFixed(0);
      toast(
        'SUCCESS',
        'Photo ready',
        formatBytes(result.originalBytes) + ' → ' + formatBytes(result.compressedBytes) +
        ' (-' + saved + '%)',
      );
    } catch (e) {
      toast('ERROR', 'Failed to process image', e instanceof Error ? e.message : 'Unknown');
    } finally {
      setUploading(false);
    }
  };
  const handleRemove = () => {
    set('avatar', '');
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast('WARNING', 'Full name is required');
      return;
    }
    setBusy(true);
    try {
      await userApi.update(user.id, {
        fullName: form.fullName,
        phone: form.phone,
        country: form.country,
        city: form.city,
        pubgNickname: form.pubgNickname,
        pubgId: form.pubgId,
        bio: form.bio,
        experienceYears: form.experienceYears,
        favoriteMap: form.favoriteMap,
        avatar: form.avatar || undefined,
        socials: form.socials,
      });
      await refresh();
      toast('SUCCESS', 'Profile updated');
      navigate('/profile');
    } catch (err) {
      toast('ERROR', 'Update failed', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-32">
      <PageHeader
        title="Edit Profile"
        subtitle="Update your avatar, links and player info"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <ArrowLeft size={13} /> Cancel
          </Button>
        }
      />

      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Avatar */}
        <Card>
          <CardHeader><CardTitle>Avatar</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <div className="flex flex-col items-center">
              <div className="relative">
                {form.avatar ? (
                  <img
                    src={form.avatar}
                    alt="avatar"
                    className="h-32 w-32 rounded-full object-cover ring-4 ring-brand-600/30"
                  />
                ) : (
                  <Avatar name={form.fullName || 'Player'} size={128} ring />
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-500"
                  aria-label="Change photo"
                >
                  <Camera size={16} />
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <p className="mt-3 text-[10px] uppercase tracking-wider text-ink-faint">
                PNG, JPG, WEBP В· max 2 MB
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => fileRef.current?.click()}
                loading={uploading}
              >
                <Camera size={13} /> {form.avatar ? 'Change' : 'Upload'}
              </Button>
              {form.avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-danger hover:bg-danger/10"
                >
                  <Trash2 size={13} />
                </Button>
              )}
            </div>

            <div className="rounded-lg border border-line bg-bg-deep/40 p-2.5">
              <p className="text-[10px] leading-relaxed text-ink-faint">
                Or paste an image URL:
              </p>
              <Input
                value={form.avatar.startsWith('data:') ? '' : form.avatar}
                onChange={e => set('avatar', e.target.value)}
                placeholder="https://..."
                className="mt-1.5 text-xs"
              />
            </div>
          </CardBody>
        </Card>

        {/* Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Basic info</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+998 90 000 00 00" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Country">
                  <Input value={form.country} onChange={e => set('country', e.target.value)} />
                </Field>
                <Field label="City">
                  <Input value={form.city} onChange={e => set('city', e.target.value)} />
                </Field>
              </div>

              <Field label="Bio" hint="Short description about you">
                <Textarea
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  placeholder="Professional PUBG player, IGL, 5 years experience..."
                  rows={3}
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>PUBG Profile</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="PUBG nickname">
                  <Input value={form.pubgNickname} onChange={e => set('pubgNickname', e.target.value)} placeholder="ALONE_IGL" />
                </Field>
                <Field label="PUBG ID">
                  <Input value={form.pubgId} onChange={e => set('pubgId', e.target.value)} placeholder="5123456789" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Experience (years)" hint="e.g. 5">
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={form.experienceYears}
                    onChange={e => set('experienceYears', parseInt(e.target.value, 10) || 0)}
                  />
                </Field>
                <Field label="Favorite map">
                  <Input value={form.favoriteMap} onChange={e => set('favoriteMap', e.target.value)} placeholder="Erangel" />
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Social links</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {SOCIALS.map(s => {
                const Icon = s.icon;
                const value = form.socials[s.key] ?? '';
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-bg-deep/40 text-brand-400">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-faint">{s.label}</p>
                      <Input
                        value={value}
                        onChange={e => setSocial(s.key, e.target.value)}
                        placeholder={s.placeholder}
                        className="text-xs"
                      />
                    </div>
                    {value && (
                      <button
                        type="button"
                        onClick={() => setSocial(s.key, '')}
                        className="shrink-0 rounded-lg p-2 text-ink-faint transition hover:bg-white/5 hover:text-danger"
                        aria-label={'Clear ' + s.label}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-bg-base/90 backdrop-blur-xl lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
            <ArrowLeft size={13} /> Cancel
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[10px] uppercase tracking-wider text-ink-faint">
              {form.fullName || 'Update your profile'}
            </p>
          </div>
          <Button type="button" variant="primary" size="sm" onClick={submit} loading={busy}>
            <Save size={13} /> Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

void UserIcon;
void Check;
void Twitch;
void Trophy;
void MapPin;
void cn;