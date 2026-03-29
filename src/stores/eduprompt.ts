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
  init(payload: { prompts: Prompt[]; flash?: { type?: string; message?: string } }): void;
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

    init(payload: { prompts: Prompt[]; flash?: { type?: string; message?: string } }) {
      store.prompts = payload.prompts ?? [];
      store.flash = {
        type: payload.flash?.type ?? "",
        message: payload.flash?.message ?? "",
      };
    },

    get filteredPrompts() {
      return store.prompts.filter((item: Prompt) => {
        const q = store.search.trim().toLowerCase();
        if (q && !`${item.title} ${item.subject ?? ""} ${item.category ?? ""}`.toLowerCase().includes(q)) {
          return false;
        }
        if (store.filters.subject && (item.subject ?? "") !== store.filters.subject) return false;
        if (store.filters.level && (item.level ?? "") !== store.filters.level) return false;
        if (store.filters.category && (item.category ?? "") !== store.filters.category) return false;

        if (store.activeTab === "favorites") return item.isFavorite && item.status === "active";
        if (store.activeTab === "archived") return item.status === "archived";
        if (store.activeTab === "prompts") return item.status === "active";
        return true;
      });
    },

    setTab(tab: string) {
      store.activeTab = tab;
    },

    openCreateDrawer() {
      store.activePromptDetail = null;
      store.drawerOpen = true;
    },

    openEditDrawer(prompt: Prompt) {
      store.activePromptDetail = prompt;
      store.drawerOpen = true;
    },

    closeDrawer() {
      store.drawerOpen = false;
    },

    beginSubmit() {
      store.isSubmitting = true;
    },

    endSubmit() {
      store.isSubmitting = false;
    },
  };

  Alpine.store("eduprompt", store);
}
