import type { Alpine } from "alpinejs";
import { registerEduPromptStore } from "./stores/eduprompt";

export default function initAlpine(Alpine: Alpine) {
  registerEduPromptStore(Alpine);
}
