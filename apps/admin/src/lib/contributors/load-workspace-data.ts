import { prisma } from '@vargah/database';
import {
  isCommissionOverdue,
  isTaskOverdue,
  type CommissionStatus,
  type ContributorType,
  type TaskStatus,
} from '@/lib/contributors/constants';

export async function loadContributorsWorkspaceData() {
  const [contributors, commissions, tasks, calendarItems, eligibleUsers, writers, issues] =
    await Promise.all([
      prisma.contributor.findMany({
        orderBy: { joinedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, commissions: true, ratings: true } },
          ratings: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { score: true, note: true, createdAt: true },
          },
        },
      }),
      prisma.articleCommission.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, name: true } },
          contributor: { include: { user: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.contributorTask.findMany({
        orderBy: { dueDate: 'asc' },
        include: {
          contributor: { include: { user: { select: { name: true } } } },
          assignedTo: { select: { id: true, name: true } },
          issue: { select: { id: true, number: true, title: true } },
        },
      }),
      prisma.editorialCalendar.findMany({
        orderBy: { dueDate: 'asc' },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          role: { in: ['WRITER', 'COPY_EDITOR'] },
          contributor: null,
        },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, email: true },
      }),
      prisma.user.findMany({
        where: { role: { in: ['WRITER', 'COPY_EDITOR'] }, status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.issue.findMany({
        orderBy: { number: 'desc' },
        take: 50,
        select: { id: true, number: true, title: true },
      }),
    ]);

  const contributorRows = contributors.map((c) => {
    const avgRating = c.ratings.length
      ? c.ratings.reduce((s, r) => s + r.score, 0) / c.ratings.length
      : null;
    return {
      id: c.id,
      userId: c.userId,
      userName: c.user.name,
      userEmail: c.user.email,
      type: c.type as ContributorType,
      bio: c.bio,
      feePerWord: c.feePerWord ? Number(c.feePerWord) : null,
      bankInfo: c.bankInfo,
      taskCount: c._count.tasks,
      commissionCount: c._count.commissions,
      ratingCount: c._count.ratings,
      avgRating,
      joinedAt: c.joinedAt,
      recentRatings: c.ratings.map((r) => ({
        score: r.score,
        note: r.note,
        createdAt: r.createdAt,
      })),
    };
  });

  const commissionRows = commissions.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status as CommissionStatus,
    assigneeId: c.assigneeId,
    assigneeName: c.assignee?.name ?? null,
    contributorId: c.contributorId,
    contributorName: c.contributor?.user.name ?? null,
    createdByName: c.createdBy.name,
    dueDate: c.dueDate,
    createdAt: c.createdAt,
    reviewNote: c.reviewNote,
    isOverdue: isCommissionOverdue(c.dueDate, c.status as CommissionStatus),
  }));

  const taskRows = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    contributorId: t.contributorId,
    contributorName: t.contributor.user.name,
    issueId: t.issueId,
    issueNumber: t.issue?.number ?? null,
    issueTitle: t.issue?.title ?? null,
    status: t.status as TaskStatus,
    dueDate: t.dueDate,
    assignedToId: t.assignedToId,
    assignedToName: t.assignedTo.name,
    createdAt: t.createdAt,
    isOverdue: isTaskOverdue(t.dueDate, t.status as TaskStatus),
  }));

  const calendarRows = calendarItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    dueDate: item.dueDate,
    userId: item.userId,
    userName: item.user.name,
    issueId: item.issueId,
    createdAt: item.createdAt,
    isOverdue: item.dueDate.getTime() < Date.now(),
  }));

  return {
    contributors: contributorRows,
    commissions: commissionRows,
    tasks: taskRows,
    calendar: calendarRows,
    eligibleUsers,
    writers,
    issues,
  };
}

export type ContributorsWorkspaceData = Awaited<ReturnType<typeof loadContributorsWorkspaceData>>;
