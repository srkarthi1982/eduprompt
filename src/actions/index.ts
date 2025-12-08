import { defineAction, ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import {
  GeneratedPrompts,
  PromptJobs,
  PromptTemplates,
  UserPromptFavorites,
  and,
  db,
  eq,
  or,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

async function ensureTemplateAccessible(templateId: number, userId: string) {
  const [template] = await db
    .select()
    .from(PromptTemplates)
    .where(eq(PromptTemplates.id, templateId));

  if (!template) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Template not found.",
    });
  }

  if (template.ownerId && template.ownerId !== userId) {
    throw new ActionError({
      code: "FORBIDDEN",
      message: "You do not have access to this template.",
    });
  }

  return template;
}

export const server = {
  createPromptTemplate: defineAction({
    input: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      template: z.string().min(1),
      tags: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const [template] = await db
        .insert(PromptTemplates)
        .values({
          ownerId: user.id,
          title: input.title,
          description: input.description,
          template: input.template,
          tags: input.tags,
          isActive: input.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        success: true,
        data: { template },
      };
    },
  }),

  updatePromptTemplate: defineAction({
    input: z
      .object({
        id: z.number().int(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        template: z.string().optional(),
        tags: z.string().optional(),
        isActive: z.boolean().optional(),
      })
      .refine(
        (input) =>
          input.title !== undefined ||
          input.description !== undefined ||
          input.template !== undefined ||
          input.tags !== undefined ||
          input.isActive !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await ensureTemplateAccessible(input.id, user.id);

      const [template] = await db
        .update(PromptTemplates)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined
            ? { description: input.description }
            : {}),
          ...(input.template !== undefined ? { template: input.template } : {}),
          ...(input.tags !== undefined ? { tags: input.tags } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          updatedAt: new Date(),
        })
        .where(eq(PromptTemplates.id, input.id))
        .returning();

      return {
        success: true,
        data: { template },
      };
    },
  }),

  listPromptTemplates: defineAction({
    input: z
      .object({
        includeInactive: z.boolean().default(false),
      })
      .optional(),
    handler: async (input, context) => {
      const user = requireUser(context);
      const includeInactive = input?.includeInactive ?? false;

      const visibilityFilter = or(
        eq(PromptTemplates.ownerId, user.id),
        eq(PromptTemplates.ownerId, null)
      );

      const templates = await db
        .select()
        .from(PromptTemplates)
        .where(
          includeInactive
            ? visibilityFilter
            : and(visibilityFilter, eq(PromptTemplates.isActive, true))
        );

      return {
        success: true,
        data: { items: templates, total: templates.length },
      };
    },
  }),

  createGeneratedPrompt: defineAction({
    input: z.object({
      templateId: z.number().int().optional(),
      input: z.record(z.any()).optional(),
      promptText: z.string().min(1),
      meta: z.record(z.any()).optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      if (input.templateId !== undefined) {
        await ensureTemplateAccessible(input.templateId, user.id);
      }

      const [prompt] = await db
        .insert(GeneratedPrompts)
        .values({
          templateId: input.templateId,
          userId: user.id,
          input: input.input,
          promptText: input.promptText,
          meta: input.meta,
          createdAt: new Date(),
        })
        .returning();

      return {
        success: true,
        data: { prompt },
      };
    },
  }),

  listGeneratedPrompts: defineAction({
    input: z
      .object({
        templateId: z.number().int().optional(),
      })
      .optional(),
    handler: async (input, context) => {
      const user = requireUser(context);
      const filters = [eq(GeneratedPrompts.userId, user.id)];

      if (input?.templateId !== undefined) {
        filters.push(eq(GeneratedPrompts.templateId, input.templateId));
      }

      const prompts = await db
        .select()
        .from(GeneratedPrompts)
        .where(and(...filters));

      return {
        success: true,
        data: { items: prompts, total: prompts.length },
      };
    },
  }),

  addFavoritePrompt: defineAction({
    input: z.object({
      promptId: z.number().int(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [prompt] = await db
        .select()
        .from(GeneratedPrompts)
        .where(and(eq(GeneratedPrompts.id, input.promptId), eq(GeneratedPrompts.userId, user.id)));

      if (!prompt) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Prompt not found.",
        });
      }

      const [existingFavorite] = await db
        .select()
        .from(UserPromptFavorites)
        .where(
          and(
            eq(UserPromptFavorites.promptId, input.promptId),
            eq(UserPromptFavorites.userId, user.id)
          )
        );

      if (existingFavorite) {
        return {
          success: true,
          data: { favorite: existingFavorite },
        };
      }

      const [favorite] = await db
        .insert(UserPromptFavorites)
        .values({
          userId: user.id,
          promptId: input.promptId,
          createdAt: new Date(),
        })
        .returning();

      return {
        success: true,
        data: { favorite },
      };
    },
  }),

  removeFavoritePrompt: defineAction({
    input: z.object({
      promptId: z.number().int(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const result = await db
        .delete(UserPromptFavorites)
        .where(
          and(
            eq(UserPromptFavorites.promptId, input.promptId),
            eq(UserPromptFavorites.userId, user.id)
          )
        );

      if (result.rowsAffected === 0) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Favorite not found.",
        });
      }

      return { success: true };
    },
  }),

  listFavoritePrompts: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const favorites = await db
        .select()
        .from(UserPromptFavorites)
        .where(eq(UserPromptFavorites.userId, user.id));

      return {
        success: true,
        data: { items: favorites, total: favorites.length },
      };
    },
  }),

  createPromptJob: defineAction({
    input: z.object({
      templateId: z.number().int().optional(),
      input: z.record(z.any()).optional(),
      output: z.record(z.any()).optional(),
      status: z.enum(["pending", "completed", "failed"]).optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      if (input.templateId !== undefined) {
        await ensureTemplateAccessible(input.templateId, user.id);
      }

      const [job] = await db
        .insert(PromptJobs)
        .values({
          userId: user.id,
          templateId: input.templateId,
          input: input.input,
          output: input.output,
          status: input.status ?? "completed",
          createdAt: new Date(),
        })
        .returning();

      return {
        success: true,
        data: { job },
      };
    },
  }),

  listPromptJobs: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const jobs = await db
        .select()
        .from(PromptJobs)
        .where(eq(PromptJobs.userId, user.id));

      return {
        success: true,
        data: { items: jobs, total: jobs.length },
      };
    },
  }),
};
