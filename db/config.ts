import { defineDb } from "astro:db";
import { EduPrompts } from "./tables";

export default defineDb({
  tables: {
    EduPrompts,
  },
});
