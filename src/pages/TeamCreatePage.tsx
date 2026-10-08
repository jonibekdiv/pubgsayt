import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Camera, Image as ImageIcon, Shield, Trash2, Upload,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { teamApi } from '@/services/api';
import { RequireAuth } from '@/components/common/require-auth';
import { cn } from '@/lib/utils';
import { compressImage, PRESETS, formatBytes } from '@/lib/image-utils';
// 50 MB limit — katta rasmlar uchun
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + ' MB';

export function TeamCreatePage() {
  return <RequireAuth><Inner /></RequireAuth>;
}

function Inner() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    name: '',
    tag: '',
    slogan: '',
    description: '',
    country: 'Uzbekistan',
    city: 'Tashkent',
  });

  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const handleFile = async (file: File, kind: 'logo' | 'banner') => {
    if (!ALLOWED.includes(file.type)) {
      toast('ERROR', 'Invalid file type', 'PNG, JPG, WEBP, GIF only');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast('ERROR', 'File too large',
        'Your file: ' + formatBytes(file.size) + ' · Max: ' + formatBytes(MAX_IMAGE_BYTES));
      return;
    }

    if (kind === 'logo') setLogoUploading(true);
    else setBannerUploading(true);

    try {
      const preset = kind === 'logo' ? PRESETS.logo : PRESETS.banner;
      const result = await compressImage(file, preset);

      if (kind === 'logo') setLogo(result.dataUrl);
      else setBanner(result.dataUrl);

      const saved = ((1 - result.ratio) * 100).toFixed(0);
      toast(
        'SUCCESS',
        (kind === 'logo' ? 'Logo' : 'Banner') + ' ready',
        formatBytes(result.originalBytes) + ' → ' + formatBytes(result.compressedBytes) +
        ' (-' + saved + '%) · ' + result.width + '×' + result.height,
      );
    } catch (e) {
      toast('ERROR', 'Failed to process image', e instanceof Error ? e.message : 'Unknown');
    } finally {
      if (kind === 'logo') setLogoUploading(false);
      else setBannerUploading(false);
    }
  };
  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) return;

    if (form.name.trim().length < 3) {
      toast('WARNING', 'Validation', 'Team name min 3 characters');
      return;
    }
    if (form.tag.trim().length < 2) {
      toast('WARNING', 'Validation', 'Tag min 2 characters');
      return;
    }

    setBusy(true);
    try {
      const team = await teamApi.create({
        name: form.name.trim(),
        tag: form.tag.trim().toUpperCase(),
        slogan: form.slogan.trim() || undefined,
        description: form.description.trim() || undefined,
        country: form.country.trim() || undefined,
        city: form.city.trim() || undefined,
        logo: logo || ('https://api.dicebear.com/7.x/bottts-neutral/svg?seed=' + form.tag + '-logo'),
        banner: banner || undefined,
        captainId: user.id,
      });
      await refresh();
      toast('SUCCESS', 'Team created', team.name + ' is ready');
      navigate('/teams/' + team.id);
    } catch (err) {
      toast('ERROR', 'Error', err instanceof Error ? err.message : 'Unknown');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="mb-3 sm:mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-brand-400"
        >
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      <PageHeader title="Create Team" subtitle="Start your squad and register for tournaments" />

      <form onSubmit={submit} className="space-y-3 sm:space-y-4">

        {/* ============================================================
            TEAM IMAGES — Banner + Logo
            ============================================================ */}
        <Card>
          <CardHeader>
            <CardTitle>Team images</CardTitle>
            <ImageIcon size={14} className="text-brand-400" />
          </CardHeader>
          <CardBody className="space-y-5">

            {/* Banner */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-ink-muted">Banner</p>
                <p className="text-[10px] text-ink-faint">
                  1200×400 · max {formatMB(MAX_IMAGE_BYTES)}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-line bg-bg-deep/40">
                <div className="relative h-32 sm:h-44">
                  {banner ? (
                    <img src={banner} alt="banner" className="h-full w-full object-cover" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={bannerUploading}
                      className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-faint transition hover:text-ink-muted disabled:opacity-50"
                    >
                      <Upload size={26} />
                      <span className="text-xs font-medium">
                        {bannerUploading ? 'Uploading...' : 'Click to upload banner'}
                      </span>
                      <span className="text-[10px]">
                        PNG, JPG, WEBP, GIF · max {formatMB(MAX_IMAGE_BYTES)}
                      </span>
                    </button>
                  )}

                  {banner && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
                      >
                        <Camera size={13} /> Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setBanner('')}
                        className="flex items-center gap-1.5 rounded-lg bg-danger/80 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-danger"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  )}
                </div>

                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f, 'banner');
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            {/* Logo */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-ink-muted">Team logo</p>
                <p className="text-[10px] text-ink-faint">Square · max {formatMB(MAX_IMAGE_BYTES)}</p>
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="relative shrink-0">
                  <div className={cn(
                    'flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-bg-deep/40 transition',
                    logo ? 'border-solid border-line' : 'border-line',
                  )}>
                    {logo ? (
                      <img src={logo} alt="logo" className="h-full w-full object-cover" />
                    ) : (
                      <Shield size={28} className="text-ink-faint" />
                    )}
                  </div>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-danger text-white shadow-lg transition hover:scale-110 active:scale-95"
                      aria-label="Remove logo"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <div className="w-full flex-1 space-y-2 sm:w-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    loading={logoUploading}
                    className="w-full sm:w-auto"
                  >
                    <Camera size={13} /> {logo ? 'Change logo' : 'Upload logo'}
                  </Button>
                  <p className="text-[10px] leading-relaxed text-ink-faint">
                    PNG, JPG, WEBP, GIF · max {formatMB(MAX_IMAGE_BYTES)}
                    {!logo && (
                      <span className="mt-0.5 block text-brand-400/80">
                        Auto-generated from tag if left empty
                      </span>
                    )}
                  </p>
                </div>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f, 'logo');
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

          </CardBody>
        </Card>

        {/* ============================================================
            TEAM INFO
            ============================================================ */}
        <Card>
          <CardHeader>
            <CardTitle>Team info</CardTitle>
            <Shield size={14} className="text-brand-400" />
          </CardHeader>
          <CardBody className="space-y-4">

            <Field label="Team name" required hint="Example: ALONE GAMERS">
              <Input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="ALONE GAMERS"
                maxLength={40}
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tag" required hint="2-4 uppercase letters">
                <Input
                  value={form.tag}
                  onChange={e => set('tag', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  maxLength={4}
                  placeholder="AG"
                  className="font-mono font-bold tracking-widest"
                  required
                />
              </Field>
              <Field label="Slogan" hint="Short tagline">
                <Input
                  value={form.slogan}
                  onChange={e => set('slogan', e.target.value)}
                  placeholder="Never Give Up"
                  maxLength={60}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country">
                <Input
                  value={form.country}
                  onChange={e => set('country', e.target.value)}
                  placeholder="Uzbekistan"
                />
              </Field>
              <Field label="City">
                <Input
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="Tashkent"
                />
              </Field>
            </div>

            <Field label="Description" hint="Tell us about your team">
              <Textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Competitive PUBG squad, active daily, IGL-focused..."
                rows={3}
                maxLength={300}
              />
            </Field>
          </CardBody>
        </Card>

        {/* ============================================================
            LIVE PREVIEW
            ============================================================ */}
        {(logo || banner || form.name) && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <span className="text-[10px] uppercase tracking-wider text-ink-faint">
                Live
              </span>
            </CardHeader>
            <CardBody>
              <div className="overflow-hidden rounded-2xl border border-line bg-bg-deep">
                <div className="relative h-24 sm:h-32">
                  {banner ? (
                    <img src={banner} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-brand-600/30 to-transparent" />
                  )}
                  <div className="absolute inset-x-0 -bottom-8 flex justify-center">
                    {logo ? (
                      <img
                        src={logo}
                        alt=""
                        className="h-16 w-16 rounded-2xl border-4 border-bg-panel bg-bg-deep object-cover shadow-xl"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-bg-panel bg-brand-600/20 font-display text-sm font-bold text-brand-400 shadow-xl">
                        {(form.tag || 'AG').slice(0, 4)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4 pt-12 text-center">
                  <p className="font-display text-base font-bold uppercase text-white">
                    {form.name || 'Your Team Name'}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {form.tag || 'TAG'}
                    {form.slogan && <span className="ml-2 italic">"{form.slogan}"</span>}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </form>

      {/* ============================================================
          STICKY ACTION BAR
          ============================================================ */}
      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-line bg-bg-base/95 backdrop-blur-xl sm:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="hidden sm:inline-flex"
          >
            <ArrowLeft size={13} /> Cancel
          </Button>
          <div className="hidden min-w-0 flex-1 text-center sm:block">
            <p className="truncate text-[10px] uppercase tracking-wider text-ink-faint">
              {form.name || 'Your new team'}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => submit()}
            loading={busy}
            disabled={!form.name || !form.tag}
            className="w-full sm:w-auto"
          >
            <Shield size={14} /> Create team
          </Button>
        </div>
      </div>
    </div>
  );
}