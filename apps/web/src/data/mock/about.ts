/**
 * @deprecated Prefer `@vargah/business/about-content` + `getPublicAboutContent()`.
 * Kept for local mock references during migration.
 */
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_ABOUT_TEAM,
  getActiveTeamMembers,
} from '@vargah/business/about-content';

export const magazineStats = DEFAULT_ABOUT_CONTENT.stats;
export const teamMembers = getActiveTeamMembers(DEFAULT_ABOUT_TEAM);
export const editorialPolicy = {
  mission: DEFAULT_ABOUT_CONTENT.mission.body,
  history: DEFAULT_ABOUT_CONTENT.history.body,
  ethics: DEFAULT_ABOUT_CONTENT.ethics.items.map((item) => `${item.title}: ${item.description}`),
};
