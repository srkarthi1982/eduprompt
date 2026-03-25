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

export function registerEduPromptStore(Alpine: Alpine) {
  Alpine.store("eduprompt", {
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
      this.prompts = payload.prompts ?? [];
      this.flash = {
        type: payload.flash?.type ?? "",
        message: payload.flash?.message ?? "",
      };
    },

    get filteredPrompts() {
      return this.prompts.filter((item) => {
        const q = this.search.trim().toLowerCase();
        if (q && !`${item.title} ${item.subject ?? ""} ${item.category ?? ""}`.toLowerCase().includes(q)) {
          return false;
        }
        if (this.filters.subject && (item.subject ?? "") !== this.filters.subject) return false;
        if (this.filters.level && (item.level ?? "") !== this.filters.level) return false;
        if (this.filters.category && (item.category ?? "") !== this.filters.category) return false;

        if (this.activeTab === "favorites") return item.isFavorite && item.status === "active";
        if (this.activeTab === "archived") return item.status === "archived";
        if (this.activeTab === "prompts") return item.status === "active";
        return true;
      });
    },

    setTab(tab: string) {
      this.activeTab = tab;
    },

    openCreateDrawer() {
      this.activePromptDetail = null;
      this.drawerOpen = true;
    },

    openEditDrawer(prompt: Prompt) {
      this.activePromptDetail = prompt;
      this.drawerOpen = true;
    },

    closeDrawer() {
      this.drawerOpen = false;
    },

    beginSubmit() {
      this.isSubmitting = true;
    },

    endSubmit() {
      this.isSubmitting = false;
    },
  });
}
