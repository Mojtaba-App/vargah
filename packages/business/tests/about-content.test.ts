import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ABOUT_CONTENT,
  getActiveTeamMembers,
  mergeAboutContent,
} from '../src/about-content';

describe('about-content', () => {
  it('returns defaults for empty input', () => {
    const merged = mergeAboutContent(null);
    expect(merged.page.title).toBe(DEFAULT_ABOUT_CONTENT.page.title);
    expect(merged.team.members).toHaveLength(DEFAULT_ABOUT_CONTENT.team.members.length);
  });

  it('merges partial overrides', () => {
    const merged = mergeAboutContent({
      page: { title: 'هویت وارگه' },
      stats: { audienceCount: 50000 },
    });
    expect(merged.page.title).toBe('هویت وارگه');
    expect(merged.page.description).toBe(DEFAULT_ABOUT_CONTENT.page.description);
    expect(merged.stats.audienceCount).toBe(50000);
    expect(merged.stats.foundedYear).toBe(DEFAULT_ABOUT_CONTENT.stats.foundedYear);
  });

  it('filters inactive team members and sorts', () => {
    const members = getActiveTeamMembers([
      { id: 'b', name: 'ب', role: 'ر', bio: '', avatar: '', isActive: true, sortOrder: 2 },
      { id: 'a', name: 'الف', role: 'ر', bio: '', avatar: '', isActive: true, sortOrder: 1 },
      { id: 'c', name: 'ج', role: 'ر', bio: '', avatar: '', isActive: false, sortOrder: 0 },
    ]);
    expect(members.map((m) => m.id)).toEqual(['a', 'b']);
  });
});
