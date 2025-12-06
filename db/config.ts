import { defineDb } from "astro:db";
import {
  PromptTemplates,
  GeneratedPrompts,
  UserPromptFavorites,
  PromptJobs,
} from "./tables";

export default defineDb({
  tables: {
    PromptTemplates,
    GeneratedPrompts,
    UserPromptFavorites,
    PromptJobs,
  },
});
