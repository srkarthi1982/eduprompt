import type { Alpine } from "alpinejs";

type Prompt = {
  id: number;
  title: string;
  subject?: string | null;
  level?: string | null;
  category?: string | null;
  status: "active" | "archived";
  isFavorite: boolean;
  updatedAt: string | Date;
};

type EduPromptStore = {
  prompts: Prompt[];
  search: string;
  filters: {
    subject: string;
    level: string;
    category: string;
  };
  activeTab: string;
  activePromptDetail: Prompt | null;
  drawerOpen: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  flash: { type: string; message: string };
  bootstrap(payload: { prompts: Prompt[]; flash?: { type?: string; message?: string } }): void;
  readonly filteredPrompts: Prompt[];
  setTab(tab: string): void;
  openCreateDrawer(): void;
  openEditDrawer(prompt: Prompt): void;
  closeDrawer(): void;
  beginSubmit(): void;
  endSubmit(): void;
};

export function registerEduPromptStore(Alpine: Alpine) {
  const store: EduPromptStore = {
    prompts: [] as Prompt[],
    search: "",
    filters: {
      subject: "",
      level: "",
      category: "",
    },
    activeTab: "overview",
    activePromptDetail: null as Prompt | null,
    drawerOpen: false,
    isSubmitting: false,
    isLoading: false,
    flash: { type: "", message: "" },

    bootstrap(payload: { prompts: Prompt[]; flash?: { type?: string; message?: string } }) {
      const state = Alpine.store("eduprompt") as EduPromptStore;
      state.prompts = payload.prompts ?? [];
      state.flash = {
        type: payload.flash?.type ?? "",
        message: payload.flash?.message ?? "",
      };
    },

    get filteredPrompts() {
      const state = (Alpine.store("eduprompt") as EduPromptStore | undefined) ?? store;
      return state.prompts.filter((item: Prompt) => {
        const q = state.search.trim().toLowerCase();
        if (q && !`${item.title} ${item.subject ?? ""} ${item.category ?? ""}`.toLowerCase().includes(q)) {
          return false;
        }
        if (state.filters.subject && (item.subject ?? "") !== state.filters.subject) return false;
        if (state.filters.level && (item.level ?? "") !== state.filters.level) return false;
        if (state.filters.category && (item.category ?? "") !== state.filters.category) return false;

        if (state.activeTab === "favorites") return item.isFavorite && item.status === "active";
        if (state.activeTab === "archived") return item.status === "archived";
        if (state.activeTab === "prompts") return item.status === "active";
        return true;
      });
    },

    setTab(tab: string) {
      const state = Alpine.store("eduprompt") as EduPromptStore;
      state.activeTab = tab;
    },

    openCreateDrawer() {
      const state = Alpine.store("eduprompt") as EduPromptStore;
      state.activePromptDetail = null;
      state.drawerOpen = true;
    },

    openEditDrawer(prompt: Prompt) {
      const state = Alpine.store("eduprompt") as EduPromptStore;
      state.activePromptDetail = prompt;
      state.drawerOpen = true;
    },

    closeDrawer() {
      const state = Alpine.store("eduprompt") as EduPromptStore;
      state.drawerOpen = false;
    },

    beginSubmit() {
      const state = Alpine.store("eduprompt") as EduPromptStore;
      state.isSubmitting = true;
    },

    endSubmit() {
      const state = Alpine.store("eduprompt") as EduPromptStore;
      state.isSubmitting = false;
    },
  };

  Alpine.store("eduprompt", store);
}
