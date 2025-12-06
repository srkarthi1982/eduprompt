import { column, defineTable, NOW } from "astro:db";

/**
 * Reusable prompt templates for teaching.
 * Example: "Explain like I'm 5", "Create a lesson introduction", etc.
 */
export const PromptTemplates = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    ownerId: column.text({ optional: true }), // if user creates custom templates
    title: column.text(),
    description: column.text({ optional: true }),

    // Template content with placeholders
    template: column.text(),

    tags: column.text({ optional: true }),

    isActive: column.boolean({ default: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * Every time a user generates a teaching prompt.
 */
export const GeneratedPrompts = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    templateId: column.number({
      references: () => PromptTemplates.columns.id,
      optional: true,
    }),

    userId: column.text({ optional: true }),

    // Input from the user
    input: column.json({ optional: true }),

    // AI output text
    promptText: column.text(),

    // Metadata (subject, grade level, difficulty, etc.)
    meta: column.json({ optional: true }),

    createdAt: column.date({ default: NOW }),
  },
});

/**
 * User-starred prompts for quick reuse.
 */
export const UserPromptFavorites = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    userId: column.text(),
    promptId: column.number({ references: () => GeneratedPrompts.columns.id }),

    createdAt: column.date({ default: NOW }),
  },
});

/**
 * History of actual AI generation jobs.
 */
export const PromptJobs = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    userId: column.text({ optional: true }),

    templateId: column.number({
      references: () => PromptTemplates.columns.id,
      optional: true,
    }),

    input: column.json({ optional: true }),
    output: column.json({ optional: true }),

    status: column.text({
      enum: ["pending", "completed", "failed"],
      default: "completed",
    }),

    createdAt: column.date({ default: NOW }),
  },
});

export const edupromptTables = {
  PromptTemplates,
  GeneratedPrompts,
  UserPromptFavorites,
  PromptJobs,
} as const;
