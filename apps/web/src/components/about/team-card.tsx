import type { AboutTeamMember } from '@vargah/business/about-content';
import { OptimizedImage } from '@/components/shared/optimized-image';
import { SocialLinks, type SocialLinksMap } from '@/components/shared/social-links';
import { cn } from '@/lib/utils';

type TeamCardProps = {
  member: AboutTeamMember;
  className?: string;
};

export function TeamCard({ member, className }: TeamCardProps) {
  const socialEntries = Object.entries(member.social ?? {}).filter(([, url]) =>
    Boolean(url && url !== '#'),
  );
  const social = Object.fromEntries(socialEntries) as SocialLinksMap;

  return (
    <article
      className={cn(
        'group border-border/80 bg-card/80 relative overflow-hidden rounded-3xl border p-6 text-center shadow-sm transition-all duration-300',
        'hover:border-primary/30 hover:-translate-y-1 hover:shadow-md',
        className,
      )}
    >
      <div
        className="from-accent/70 absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-80 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
      <OptimizedImage
        src={member.avatar}
        alt={member.name}
        width={112}
        height={112}
        wrapperClassName="relative mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full ring-4 ring-background shadow-md"
        className="rounded-full object-cover"
        sizes="112px"
      />
      <h3 className="relative text-lg font-bold tracking-tight">{member.name}</h3>
      <p className="text-primary relative mt-1 text-sm font-medium">{member.role}</p>
      <p className="text-muted-foreground relative mt-3 text-sm leading-relaxed">{member.bio}</p>
      <SocialLinks links={social} className="relative mt-5 justify-center" size="sm" />
    </article>
  );
}
