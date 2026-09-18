'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useRouter } from 'next/navigation';
import type {
  AboutContent,
  AboutEthicsItem,
  AboutMilestone,
  AboutTeamMember,
} from '@vargah/business/about-content';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';

import { updateAboutContentSection, type AboutContentSection } from '@/actions/settings';
import { isNextRedirect } from '@/lib/action-state';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { ReasonConfirmDialog } from '@/components/ui/feedback/reason-confirm-dialog';
import { SettingsAccordionSection } from '@/components/settings/settings-accordion-section';
import { adminApiPath, adminPath } from '@/lib/base-path';
import { csrfHeaders } from '@/lib/csrf-client';
import { getActionErrorMessage } from '@/lib/settings/errors';

type AboutSettingsPanelProps = {
  initialContent: AboutContent;
  canEdit: boolean;
};

type PendingDelete =
  | { kind: 'milestone'; index: number }
  | { kind: 'member'; index: number }
  | { kind: 'ethics'; index: number };

const MILESTONE_DELETE_REASONS = [
  'نقطه عطف دیگر مرتبط نیست',
  'اطلاعات اشتباه ثبت شده',
  'جایگزینی با مورد جدید',
  'تکراری بودن مورد',
] as const;

const TEAM_DELETE_REASONS = [
  'عضو دیگر در تحریریه نیست',
  'اطلاعات اشتباه ثبت شده',
  'جایگزینی با عضو جدید',
  'درخواست خود فرد',
] as const;

const ETHICS_DELETE_REASONS = [
  'اصل دیگر در سیاست تحریریه نیست',
  'متن اشتباه ثبت شده',
  'جایگزینی با اصل جدید',
  'تکراری بودن مورد',
] as const;

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function AboutSettingsPanel({ initialContent, canEdit }: AboutSettingsPanelProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [feedback, setFeedback] = useState<{
    section: AboutContentSection;
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [savingSection, setSavingSection] = useState<AboutContentSection | null>(null);
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [, startSave] = useTransition();
  const dismissFeedback = useCallback(() => setFeedback(null), []);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  function saveSection(section: AboutContentSection, label: string) {
    setFeedback(null);
    setSavingSection(section);
    startSave(async () => {
      try {
        await updateAboutContentSection(
          section,
          content[section] as AboutContent[AboutContentSection],
        );
        setFeedback({ section, type: 'success', message: `${label} ذخیره شد` });
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setFeedback({ section, type: 'error', message: getActionErrorMessage(err) });
      } finally {
        setSavingSection(null);
      }
    });
  }

  async function uploadAvatar(memberIndex: number, file: File) {
    const member = content.team.members[memberIndex];
    if (!member) return;
    setUploadingMemberId(member.id);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.set('file', file);
      const res = await fetch(adminApiPath('/api/settings/about-avatar/upload'), {
        method: 'POST',
        headers: csrfHeaders(),
        body: formData,
        credentials: 'include',
      });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) {
        setFeedback({
          section: 'team',
          type: 'error',
          message: data.error ?? 'آپلود آواتار ناموفق بود',
        });
        return;
      }
      updateMember(setContent, memberIndex, { avatar: data.path });
      setFeedback({
        section: 'team',
        type: 'success',
        message: 'آواتار آپلود شد — بخش تیم را ذخیره کنید.',
      });
    } catch {
      setFeedback({ section: 'team', type: 'error', message: 'خطا در آپلود آواتار' });
    } finally {
      setUploadingMemberId(null);
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="هدر صفحه"
        defaultOpen
        canEdit={canEdit}
        saving={savingSection === 'page'}
        onSave={() => saveSection('page', 'هدر صفحه')}
        feedback={feedback?.section === 'page' ? feedback : null}
        onDismissFeedback={dismissFeedback}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Eyebrow"
            value={content.page.eyebrow}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, page: { ...prev.page, eyebrow: value } }))
            }
          />
          <Field
            label="عنوان"
            value={content.page.title}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, page: { ...prev.page, title: value } }))
            }
          />
          <div className="md:col-span-2">
            <TextField
              label="توضیح کوتاه"
              value={content.page.description}
              disabled={!canEdit}
              rows={2}
              onChange={(value) =>
                setContent((prev) => ({ ...prev, page: { ...prev.page, description: value } }))
              }
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="بلوک معرفی صفحه اصلی"
        canEdit={canEdit}
        saving={savingSection === 'intro'}
        onSave={() => saveSection('intro', 'معرفی صفحه اصلی')}
        feedback={feedback?.section === 'intro' ? feedback : null}
        onDismissFeedback={dismissFeedback}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Eyebrow"
            value={content.intro.eyebrow}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, intro: { ...prev.intro, eyebrow: value } }))
            }
          />
          <Field
            label="عنوان دکمه"
            value={content.intro.ctaLabel}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, intro: { ...prev.intro, ctaLabel: value } }))
            }
          />
          <Field
            label="عنوان"
            value={content.intro.title}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, intro: { ...prev.intro, title: value } }))
            }
          />
          <Field
            label="زیرعنوان"
            value={content.intro.subtitle}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, intro: { ...prev.intro, subtitle: value } }))
            }
          />
          <div className="md:col-span-2">
            <TextField
              label="متن معرفی"
              value={content.intro.body}
              disabled={!canEdit}
              rows={3}
              onChange={(value) =>
                setContent((prev) => ({ ...prev, intro: { ...prev.intro, body: value } }))
              }
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="آمار"
        canEdit={canEdit}
        saving={savingSection === 'stats'}
        onSave={() => saveSection('stats', 'آمار')}
        feedback={feedback?.section === 'stats' ? feedback : null}
        onDismissFeedback={dismissFeedback}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField
            label="شماره منتشرشده"
            value={content.stats.issueCount}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, stats: { ...prev.stats, issueCount: value } }))
            }
          />
          <NumberField
            label="سال فعالیت"
            value={content.stats.activeYears}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, stats: { ...prev.stats, activeYears: value } }))
            }
          />
          <NumberField
            label="مخاطب فعال"
            value={content.stats.audienceCount}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, stats: { ...prev.stats, audienceCount: value } }))
            }
          />
          <NumberField
            label="سال تأسیس"
            value={content.stats.foundedYear}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, stats: { ...prev.stats, foundedYear: value } }))
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title="مأموریت"
        canEdit={canEdit}
        saving={savingSection === 'mission'}
        onSave={() => saveSection('mission', 'مأموریت')}
        feedback={feedback?.section === 'mission' ? feedback : null}
        onDismissFeedback={dismissFeedback}
      >
        <div className="grid gap-4">
          <Field
            label="عنوان"
            value={content.mission.title}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, mission: { ...prev.mission, title: value } }))
            }
          />
          <TextField
            label="متن مأموریت"
            value={content.mission.body}
            disabled={!canEdit}
            rows={4}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, mission: { ...prev.mission, body: value } }))
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title="تاریخچه"
        canEdit={canEdit}
        saving={savingSection === 'history'}
        onSave={() => saveSection('history', 'تاریخچه')}
        feedback={feedback?.section === 'history' ? feedback : null}
        onDismissFeedback={dismissFeedback}
      >
        <div className="grid gap-4">
          <Field
            label="عنوان"
            value={content.history.title}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, history: { ...prev.history, title: value } }))
            }
          />
          <TextField
            label="متن تاریخچه"
            value={content.history.body}
            disabled={!canEdit}
            rows={4}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, history: { ...prev.history, body: value } }))
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title="نقاط عطف تاریخچه"
        canEdit={canEdit}
        saving={savingSection === 'milestones'}
        onSave={() => saveSection('milestones', 'نقاط عطف')}
        feedback={feedback?.section === 'milestones' ? feedback : null}
        onDismissFeedback={dismissFeedback}
        actions={
          canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  milestones: [
                    ...prev.milestones,
                    {
                      id: newId('ms'),
                      year: '',
                      title: '',
                      description: '',
                    } satisfies AboutMilestone,
                  ],
                }))
              }
            >
              افزودن
            </Button>
          ) : null
        }
      >
        {content.milestones.map((item, index) => (
          <div
            key={item.id}
            className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-3"
          >
            <Field
              label="سال"
              value={item.year}
              disabled={!canEdit}
              onChange={(value) =>
                setContent((prev) => ({
                  ...prev,
                  milestones: prev.milestones.map((row, i) =>
                    i === index ? { ...row, year: value } : row,
                  ),
                }))
              }
            />
            <Field
              label="عنوان"
              value={item.title}
              disabled={!canEdit}
              onChange={(value) =>
                setContent((prev) => ({
                  ...prev,
                  milestones: prev.milestones.map((row, i) =>
                    i === index ? { ...row, title: value } : row,
                  ),
                }))
              }
            />
            <div className="md:col-span-3">
              <TextField
                label="توضیح"
                value={item.description}
                disabled={!canEdit}
                rows={2}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    milestones: prev.milestones.map((row, i) =>
                      i === index ? { ...row, description: value } : row,
                    ),
                  }))
                }
              />
            </div>
            {canEdit && (
              <div className="md:col-span-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setPendingDelete({ kind: 'milestone', index })}
                >
                  حذف نقطه عطف
                </Button>
              </div>
            )}
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="تیم تحریریه"
        canEdit={canEdit}
        saving={savingSection === 'team'}
        onSave={() => saveSection('team', 'تیم تحریریه')}
        feedback={feedback?.section === 'team' ? feedback : null}
        onDismissFeedback={dismissFeedback}
        actions={
          canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  team: {
                    ...prev.team,
                    members: [
                      ...prev.team.members,
                      {
                        id: newId('team'),
                        name: '',
                        role: '',
                        bio: '',
                        avatar: '/images/mock/placeholder-avatar.svg',
                        isActive: true,
                        sortOrder: prev.team.members.length + 1,
                      } satisfies AboutTeamMember,
                    ],
                  },
                }))
              }
            >
              افزودن عضو
            </Button>
          ) : null
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="عنوان بخش"
            value={content.team.title}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, team: { ...prev.team, title: value } }))
            }
          />
          <Field
            label="زیرعنوان"
            value={content.team.subtitle}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, team: { ...prev.team, subtitle: value } }))
            }
          />
        </div>

        <div className="mt-4 space-y-4">
          {content.team.members.map((member, index) => (
            <div
              key={member.id}
              className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-[112px_1fr]"
            >
              <AvatarUploader
                avatar={member.avatar}
                name={member.name || 'عضو تیم'}
                disabled={!canEdit}
                uploading={uploadingMemberId === member.id}
                onFile={(file) => void uploadAvatar(index, file)}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label="نام"
                  value={member.name}
                  disabled={!canEdit}
                  onChange={(value) => updateMember(setContent, index, { name: value })}
                />
                <Field
                  label="نقش"
                  value={member.role}
                  disabled={!canEdit}
                  onChange={(value) => updateMember(setContent, index, { role: value })}
                />
                <div className="md:col-span-2">
                  <TextField
                    label="بیو"
                    value={member.bio}
                    disabled={!canEdit}
                    rows={2}
                    onChange={(value) => updateMember(setContent, index, { bio: value })}
                  />
                </div>
                <NumberField
                  label="ترتیب نمایش"
                  value={member.sortOrder ?? index + 1}
                  disabled={!canEdit}
                  onChange={(value) => updateMember(setContent, index, { sortOrder: value })}
                />
                <Field
                  label="لینکدین"
                  value={member.social?.linkedin ?? ''}
                  disabled={!canEdit}
                  onChange={(value) =>
                    updateMember(setContent, index, {
                      social: { ...member.social, linkedin: value || undefined },
                    })
                  }
                />
                <Field
                  label="اینستاگرام"
                  value={member.social?.instagram ?? ''}
                  disabled={!canEdit}
                  onChange={(value) =>
                    updateMember(setContent, index, {
                      social: { ...member.social, instagram: value || undefined },
                    })
                  }
                />
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    checked={member.isActive !== false}
                    disabled={!canEdit}
                    onChange={(e) =>
                      updateMember(setContent, index, { isActive: e.target.checked })
                    }
                  />
                  نمایش در سایت
                </label>
                {canEdit && (
                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setPendingDelete({ kind: 'member', index })}
                    >
                      حذف عضو
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="اصول اخلاق حرفه‌ای"
        canEdit={canEdit}
        saving={savingSection === 'ethics'}
        onSave={() => saveSection('ethics', 'اصول اخلاق')}
        feedback={feedback?.section === 'ethics' ? feedback : null}
        onDismissFeedback={dismissFeedback}
        actions={
          canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  ethics: {
                    ...prev.ethics,
                    items: [
                      ...prev.ethics.items,
                      { id: newId('eth'), title: '', description: '' } satisfies AboutEthicsItem,
                    ],
                  },
                }))
              }
            >
              افزودن اصل
            </Button>
          ) : null
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="عنوان بخش"
            value={content.ethics.title}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, ethics: { ...prev.ethics, title: value } }))
            }
          />
          <Field
            label="زیرعنوان"
            value={content.ethics.subtitle}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, ethics: { ...prev.ethics, subtitle: value } }))
            }
          />
        </div>
        {content.ethics.items.map((item, index) => (
          <div
            key={item.id}
            className="border-border mt-4 grid gap-3 rounded-xl border p-4 md:grid-cols-2"
          >
            <Field
              label="عنوان اصل"
              value={item.title}
              disabled={!canEdit}
              onChange={(value) =>
                setContent((prev) => ({
                  ...prev,
                  ethics: {
                    ...prev.ethics,
                    items: prev.ethics.items.map((row, i) =>
                      i === index ? { ...row, title: value } : row,
                    ),
                  },
                }))
              }
            />
            <div className="md:col-span-2">
              <TextField
                label="توضیح"
                value={item.description}
                disabled={!canEdit}
                rows={2}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    ethics: {
                      ...prev.ethics,
                      items: prev.ethics.items.map((row, i) =>
                        i === index ? { ...row, description: value } : row,
                      ),
                    },
                  }))
                }
              />
            </div>
            {canEdit && (
              <div className="md:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setPendingDelete({ kind: 'ethics', index })}
                >
                  حذف اصل
                </Button>
              </div>
            )}
          </div>
        ))}
      </SectionCard>

      <SectionCard
        title="فراخوان انتهای صفحه"
        canEdit={canEdit}
        saving={savingSection === 'cta'}
        onSave={() => saveSection('cta', 'فراخوان')}
        feedback={feedback?.section === 'cta' ? feedback : null}
        onDismissFeedback={dismissFeedback}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="عنوان"
            value={content.cta.title}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, cta: { ...prev.cta, title: value } }))
            }
          />
          <div className="md:col-span-2">
            <TextField
              label="توضیح"
              value={content.cta.description}
              disabled={!canEdit}
              rows={2}
              onChange={(value) =>
                setContent((prev) => ({ ...prev, cta: { ...prev.cta, description: value } }))
              }
            />
          </div>
          <Field
            label="دکمه اصلی"
            value={content.cta.primaryLabel}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, cta: { ...prev.cta, primaryLabel: value } }))
            }
          />
          <Field
            label="لینک دکمه اصلی"
            value={content.cta.primaryHref}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, cta: { ...prev.cta, primaryHref: value } }))
            }
          />
          <Field
            label="دکمه ثانویه"
            value={content.cta.secondaryLabel}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, cta: { ...prev.cta, secondaryLabel: value } }))
            }
          />
          <Field
            label="لینک دکمه ثانویه"
            value={content.cta.secondaryHref}
            disabled={!canEdit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, cta: { ...prev.cta, secondaryHref: value } }))
            }
          />
        </div>
      </SectionCard>

      <ReasonConfirmDialog
        open={pendingDelete?.kind === 'milestone'}
        title="حذف نقطه عطف"
        description={
          pendingDelete?.kind === 'milestone'
            ? `نقطه عطف «${content.milestones[pendingDelete.index]?.title || content.milestones[pendingDelete.index]?.year || 'بدون عنوان'}» حذف می‌شود.`
            : ''
        }
        reasons={MILESTONE_DELETE_REASONS}
        onCancel={() => setPendingDelete(null)}
        onConfirm={(reason) => {
          if (pendingDelete?.kind !== 'milestone') return;
          const item = content.milestones[pendingDelete.index];
          const label = item?.title || item?.year || 'نقطه عطف';
          setContent((prev) => ({
            ...prev,
            milestones: prev.milestones.filter((_, i) => i !== pendingDelete.index),
          }));
          setPendingDelete(null);
          setFeedback({
            section: 'milestones',
            type: 'success',
            message: `«${label}» حذف شد — دلیل: ${reason}. بخش نقاط عطف را ذخیره کنید.`,
          });
        }}
      />

      <ReasonConfirmDialog
        open={pendingDelete?.kind === 'member'}
        title="حذف عضو تیم"
        description={
          pendingDelete?.kind === 'member'
            ? `عضو «${content.team.members[pendingDelete.index]?.name || 'بدون نام'}» حذف می‌شود.`
            : ''
        }
        reasons={TEAM_DELETE_REASONS}
        onCancel={() => setPendingDelete(null)}
        onConfirm={(reason) => {
          if (pendingDelete?.kind !== 'member') return;
          const name = content.team.members[pendingDelete.index]?.name || 'عضو';
          setContent((prev) => ({
            ...prev,
            team: {
              ...prev.team,
              members: prev.team.members.filter((_, i) => i !== pendingDelete.index),
            },
          }));
          setPendingDelete(null);
          setFeedback({
            section: 'team',
            type: 'success',
            message: `«${name}» حذف شد — دلیل: ${reason}. بخش تیم را ذخیره کنید.`,
          });
        }}
      />

      <ReasonConfirmDialog
        open={pendingDelete?.kind === 'ethics'}
        title="حذف اصل اخلاق حرفه‌ای"
        description={
          pendingDelete?.kind === 'ethics'
            ? `اصل «${content.ethics.items[pendingDelete.index]?.title || 'بدون عنوان'}» حذف می‌شود.`
            : ''
        }
        reasons={ETHICS_DELETE_REASONS}
        onCancel={() => setPendingDelete(null)}
        onConfirm={(reason) => {
          if (pendingDelete?.kind !== 'ethics') return;
          const title = content.ethics.items[pendingDelete.index]?.title || 'اصل';
          setContent((prev) => ({
            ...prev,
            ethics: {
              ...prev.ethics,
              items: prev.ethics.items.filter((_, i) => i !== pendingDelete.index),
            },
          }));
          setPendingDelete(null);
          setFeedback({
            section: 'ethics',
            type: 'success',
            message: `«${title}» حذف شد — دلیل: ${reason}. بخش اصول اخلاق را ذخیره کنید.`,
          });
        }}
      />
    </div>
  );
}

function AvatarUploader({
  avatar,
  name,
  disabled,
  uploading,
  onFile,
}: {
  avatar: string;
  name: string;
  disabled?: boolean;
  uploading?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          avatar.startsWith('/uploads/')
            ? adminPath(avatar)
            : avatar || '/images/mock/placeholder-avatar.svg'
        }
        alt={name}
        className="border-border bg-muted size-24 rounded-full border object-cover"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.currentTarget.value = '';
        }}
      />
      <LoadingButton
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full"
        disabled={disabled}
        loading={Boolean(uploading)}
        onClick={() => inputRef.current?.click()}
      >
        انتخاب عکس
      </LoadingButton>
      <p className="text-muted-foreground text-[11px]">JPG / PNG / WebP</p>
    </div>
  );
}

function updateMember(
  setContent: Dispatch<SetStateAction<AboutContent>>,
  index: number,
  patch: Partial<AboutTeamMember>,
) {
  setContent((prev) => ({
    ...prev,
    team: {
      ...prev.team,
      members: prev.team.members.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    },
  }));
}

function SectionCard({
  title,
  canEdit,
  saving,
  onSave,
  actions,
  feedback,
  onDismissFeedback,
  defaultOpen = false,
  children,
}: {
  title: string;
  canEdit: boolean;
  saving: boolean;
  onSave: () => void;
  actions?: ReactNode;
  feedback?: { type: 'success' | 'error'; message: string } | null;
  onDismissFeedback?: () => void;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <SettingsAccordionSection
      title={title}
      defaultOpen={defaultOpen}
      canEdit={canEdit}
      saving={saving}
      onSave={onSave}
      actions={actions}
      feedback={feedback}
      onDismissFeedback={onDismissFeedback}
    >
      {children}
    </SettingsAccordionSection>
  );
}

function Field({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 rounded-xl"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  disabled,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea
        value={value}
        disabled={disabled}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 rounded-xl"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-2 rounded-xl"
        dir="ltr"
      />
    </div>
  );
}
