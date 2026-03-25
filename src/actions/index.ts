import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import {
  createEduPromptRecord,
  getEduPromptDetail,
  listEduPrompts,
  setEduPromptStatus,
  toggleEduPromptFavoriteRecord,
  updateEduPromptRecord,
} from "../lib/eduprompt";

function requireUser(context: ActionAPIContext) {
  const user = (context.locals as App.Locals).user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

const promptInput = z.object({
  title: z.string().min(1).max(180),
  subject: z.string().max(120).optional(),
  level: z.string().max(120).optional(),
  category: z.string().max(120).optional(),
  promptText: z.string().min(1),
  expectedOutputNotes: z.string().optional(),
  teachingNotes: z.string().optional(),
});

export { listEduPrompts, getEduPromptDetail };

export const server = {
  createEduPrompt: defineAction({
    input: promptInput,
    handler: async (input, context) => {
      const user = requireUser(context);
      const prompt = await createEduPromptRecord(user.id, input);
      return { success: true, data: { prompt } };
    },
  }),

  updateEduPrompt: defineAction({
    input: promptInput.partial().extend({
      id: z.number().int(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const { id, ...changes } = input;

      const hasChange = Object.values(changes).some((value) => value !== undefined);
      if (!hasChange) {
        throw new ActionError({ code: "BAD_REQUEST", message: "No updates provided." });
      }

      const prompt = await updateEduPromptRecord(user.id, id, changes);
      return { success: true, data: { prompt } };
    },
  }),

  archiveEduPrompt: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async ({ id }, context) => {
      const user = requireUser(context);
      const prompt = await setEduPromptStatus(user.id, id, "archived");
      return { success: true, data: { prompt } };
    },
  }),

  restoreEduPrompt: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async ({ id }, context) => {
      const user = requireUser(context);
      const prompt = await setEduPromptStatus(user.id, id, "active");
      return { success: true, data: { prompt } };
    },
  }),

  toggleEduPromptFavorite: defineAction({
    input: z.object({ id: z.number().int() }),
    handler: async ({ id }, context) => {
      const user = requireUser(context);
      const prompt = await toggleEduPromptFavoriteRecord(user.id, id);
      return { success: true, data: { prompt } };
    },
  }),
};
