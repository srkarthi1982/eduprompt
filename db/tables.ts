import { column, defineTable, NOW } from "astro:db";

export const EduPrompts = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    userId: column.text(),
    title: column.text(),
    subject: column.text({ optional: true }),
    level: column.text({ optional: true }),
    category: column.text({ optional: true }),
    promptText: column.text(),
    expectedOutputNotes: column.text({ optional: true }),
    teachingNotes: column.text({ optional: true }),
    isFavorite: column.boolean({ default: false }),
    status: column.text({ enum: ["active", "archived"], default: "active" }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
    archivedAt: column.date({ optional: true }),
  },
  indexes: [
    { name: "eduprompt_user_idx", on: ["userId"] },
    { name: "eduprompt_user_status_idx", on: ["userId", "status"] },
    { name: "eduprompt_user_favorite_idx", on: ["userId", "isFavorite"] },
    { name: "eduprompt_subject_idx", on: ["subject"] },
    { name: "eduprompt_level_idx", on: ["level"] },
    { name: "eduprompt_category_idx", on: ["category"] },
    { name: "eduprompt_updated_idx", on: ["updatedAt"] },
  ],
});
