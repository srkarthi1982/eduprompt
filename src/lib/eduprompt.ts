import { ActionError } from "astro:actions";
import { EduPrompts, and, db, desc, eq } from "astro:db";

export type EduPromptStatus = "active" | "archived";

export type PromptInput = {
  title: string;
  subject?: string;
  level?: string;
  category?: string;
  promptText: string;
  expectedOutputNotes?: string;
  teachingNotes?: string;
};

function cleanOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function assertUser(userId?: string): string {
  if (!userId) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "Sign in required.",
    });
  }
  return userId;
}

export async function listEduPrompts(userId: string) {
  assertUser(userId);
  return db
    .select()
    .from(EduPrompts)
    .where(eq(EduPrompts.userId, userId))
    .orderBy(desc(EduPrompts.updatedAt));
}

export async function getEduPromptDetail(userId: string, id: number) {
  assertUser(userId);
  const [prompt] = await db
    .select()
    .from(EduPrompts)
    .where(and(eq(EduPrompts.id, id), eq(EduPrompts.userId, userId)));

  if (!prompt) {
    throw new ActionError({ code: "NOT_FOUND", message: "Prompt not found." });
  }

  return prompt;
}

export async function createEduPromptRecord(userId: string, input: PromptInput) {
  assertUser(userId);
  const now = new Date();
  const [prompt] = await db
    .insert(EduPrompts)
    .values({
      userId,
      title: input.title.trim(),
      subject: cleanOptional(input.subject),
      level: cleanOptional(input.level),
      category: cleanOptional(input.category),
      promptText: input.promptText.trim(),
      expectedOutputNotes: cleanOptional(input.expectedOutputNotes),
      teachingNotes: cleanOptional(input.teachingNotes),
      status: "active",
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      archivedAt: undefined,
    })
    .returning();

  await emitHighSignalEvents(userId);
  return prompt;
}

export async function updateEduPromptRecord(userId: string, id: number, input: Partial<PromptInput>) {
  assertUser(userId);
  await getEduPromptDetail(userId, id);

  const payload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.subject !== undefined) payload.subject = cleanOptional(input.subject);
  if (input.level !== undefined) payload.level = cleanOptional(input.level);
  if (input.category !== undefined) payload.category = cleanOptional(input.category);
  if (input.promptText !== undefined) payload.promptText = input.promptText.trim();
  if (input.expectedOutputNotes !== undefined) payload.expectedOutputNotes = cleanOptional(input.expectedOutputNotes);
  if (input.teachingNotes !== undefined) payload.teachingNotes = cleanOptional(input.teachingNotes);

  const [prompt] = await db
    .update(EduPrompts)
    .set(payload)
    .where(and(eq(EduPrompts.id, id), eq(EduPrompts.userId, userId)))
    .returning();

  await pushDashboardSummary(userId);
  return prompt;
}

export async function setEduPromptStatus(userId: string, id: number, status: EduPromptStatus) {
  assertUser(userId);
  await getEduPromptDetail(userId, id);

  const [prompt] = await db
    .update(EduPrompts)
    .set({
      status,
      archivedAt: status === "archived" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(EduPrompts.id, id), eq(EduPrompts.userId, userId)))
    .returning();

  await pushDashboardSummary(userId);
  return prompt;
}

export async function toggleEduPromptFavoriteRecord(userId: string, id: number) {
  const prompt = await getEduPromptDetail(userId, id);

  const [updated] = await db
    .update(EduPrompts)
    .set({
      isFavorite: !prompt.isFavorite,
      updatedAt: new Date(),
    })
    .where(and(eq(EduPrompts.id, id), eq(EduPrompts.userId, userId)))
    .returning();

  await emitHighSignalEvents(userId);
  return updated;
}

export async function getSummary(userId: string) {
  const prompts = await listEduPrompts(userId);
  const active = prompts.filter((item) => item.status === "active");
  const favorites = prompts.filter((item) => item.isFavorite);
  const archived = prompts.filter((item) => item.status === "archived");
  const subjects = new Set(prompts.map((item) => item.subject).filter(Boolean));

  const oneWeekAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const recentlyUpdated = prompts.filter((item) => new Date(item.updatedAt).getTime() >= oneWeekAgo);

  return {
    total: prompts.length,
    active: active.length,
    favorites: favorites.length,
    archived: archived.length,
    subjectCount: subjects.size,
    recentlyUpdated: recentlyUpdated.length,
    latestTitle: prompts[0]?.title ?? null,
  };
}

async function pushDashboardSummary(userId: string) {
  const webhook = import.meta.env.ANSIVERSA_DASHBOARD_WEBHOOK_URL;
  if (!webhook) return;

  const summary = await getSummary(userId);

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appId: "eduprompt",
      userId,
      summary: {
        totalPrompts: summary.total,
        favoritesCount: summary.favorites,
        subjectCount: summary.subjectCount,
        mostRecentTitle: summary.latestTitle,
      },
      generatedAt: new Date().toISOString(),
    }),
  }).catch(() => null);
}

async function emitHighSignalEvents(userId: string) {
  await pushDashboardSummary(userId);

  const webhook = import.meta.env.ANSIVERSA_NOTIFICATIONS_WEBHOOK_URL;
  if (!webhook) return;

  const summary = await getSummary(userId);
  const notifications: Array<{ key: string; title: string; message: string }> = [];

  if (summary.total === 1) {
    notifications.push({
      key: "first_prompt",
      title: "First EduPrompt created",
      message: "Your teaching prompt library is now started.",
    });
  }

  if (summary.favorites === 1) {
    notifications.push({
      key: "first_favorite",
      title: "First favorite saved",
      message: "Pinned your first high-value prompt.",
    });
  }

  if (summary.total === 25) {
    notifications.push({
      key: "milestone_25",
      title: "25 prompts milestone",
      message: "You now have 25 prompts in EduPrompt.",
    });
  }

  await Promise.all(
    notifications.map((event) =>
      fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: "eduprompt",
          userId,
          level: "info",
          ...event,
          occurredAt: new Date().toISOString(),
        }),
      }).catch(() => null)
    )
  );
}
