import { Volunteer, VolunteerStatus } from "@/types/volunteer";
import { seedVolunteers } from "@/data/seed";

const STORAGE_KEY = "avadi_volunteers";
const DRAFT_KEY = "avadi_volunteer_draft";
const MY_VOLUNTEER_KEY = "avadi_my_volunteer_id";

class VolunteerService {
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  private getStored(): Volunteer[] {
    if (!this.isBrowser()) {
      return seedVolunteers;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Initialize with seed data
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedVolunteers));
        return seedVolunteers;
      }
      return JSON.parse(data) as Volunteer[];
    } catch (e) {
      console.error("Failed to read volunteers from localStorage:", e);
      return seedVolunteers;
    }
  }

  private saveStored(volunteers: Volunteer[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(volunteers));
    } catch (e) {
      console.error("Failed to save volunteers to localStorage:", e);
    }
  }

  /**
   * Syncs volunteer records with MySQL database via /api/volunteers
   */
  public async syncWithDb(): Promise<Volunteer[]> {
    if (!this.isBrowser()) return this.getStored();
    try {
      const res = await fetch("/api/volunteers");
      if (res.ok) {
        const data = (await res.json()) as Volunteer[];
        if (Array.isArray(data) && data.length > 0) {
          this.saveStored(data);
          return data;
        }
      }
    } catch (e) {
      console.warn("Could not sync volunteers with database, using local cache:", e);
    }
    return this.getStored();
  }

  public list(): Volunteer[] {
    return this.getStored();
  }

  public getById(id: string): Volunteer | null {
    const list = this.getStored();
    return list.find((v) => v.id === id) || null;
  }

  public getByUserId(userId: string): Volunteer | null {
    if (!userId) return null;
    const list = this.getStored();
    return list.find((v) => v.userId === userId) || null;
  }

  public getMyVolunteer(
    userId?: string,
    phone?: string,
    name?: string,
  ): Volunteer | null {
    const list = this.getStored();
    if (this.isBrowser()) {
      const myId = localStorage.getItem(MY_VOLUNTEER_KEY);
      if (myId) {
        const found = list.find((v) => v.id === myId);
        if (found) return found;
      }
    }
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    const cleanName = name ? name.trim().toLowerCase() : "";
    const found =
      list.find(
        (v) =>
          (userId && v.userId === userId) ||
          (cleanPhone &&
            v.contact?.mobile?.replace(/\D/g, "") === cleanPhone) ||
          (cleanName && v.fullName?.trim().toLowerCase() === cleanName),
      ) || null;

    if (found && this.isBrowser()) {
      localStorage.setItem(MY_VOLUNTEER_KEY, found.id);
    }
    return found;
  }

  public getByPhoneOrName(phone: string, name: string): Volunteer | null {
    const list = this.getStored();
    return (
      list.find(
        (v) =>
          (phone && v.contact?.mobile === phone) ||
          (name && v.fullName.toLowerCase() === name.toLowerCase()),
      ) || null
    );
  }

  public create(
    data: Omit<Volunteer, "id" | "createdAt" | "updatedAt" | "status"> & {
      status?: VolunteerStatus;
    },
  ): Volunteer {
    const list = this.getStored();
    // Auto-generate format AVC-VOL-0001
    const count = list.length + 1;
    const nextId = `AVC-VOL-${String(count).padStart(4, "0")}`;
    const now = new Date().toISOString();

    const newVolunteer: Volunteer = {
      ...data,
      id: nextId,
      status: data.status || "active",
      createdAt: now,
      updatedAt: now,
    };

    const updatedList = [newVolunteer, ...list];
    this.saveStored(updatedList);
    this.clearDraft();

    if (this.isBrowser()) {
      localStorage.setItem(MY_VOLUNTEER_KEY, nextId);
    }

    // Persist to MySQL database asynchronously
    if (this.isBrowser()) {
      fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVolunteer),
      })
        .then(async (res) => {
          if (res.ok) {
            const saved = (await res.json()) as Volunteer;
            if (saved?.id) {
              const current = this.getStored().map((v) =>
                v.id === nextId ? saved : v,
              );
              this.saveStored(current);
              localStorage.setItem(MY_VOLUNTEER_KEY, saved.id);
            }
          }
        })
        .catch((err) =>
          console.error("Failed to persist volunteer to MySQL database:", err),
        );
    }

    return newVolunteer;
  }

  public async createAsync(
    data: Omit<Volunteer, "id" | "createdAt" | "updatedAt" | "status"> & {
      status?: VolunteerStatus;
    },
  ): Promise<Volunteer> {
    const list = this.getStored();
    const count = list.length + 1;
    const tempId = `AVC-VOL-${String(count).padStart(4, "0")}`;
    const now = new Date().toISOString();

    const localVolunteer: Volunteer = {
      ...data,
      id: tempId,
      status: data.status || "active",
      createdAt: now,
      updatedAt: now,
    };

    if (this.isBrowser()) {
      try {
        const res = await fetch("/api/volunteers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localVolunteer),
        });

        if (res.ok) {
          const saved = (await res.json()) as Volunteer;
          if (saved?.id) {
            const updatedList = [
              saved,
              ...this.getStored().filter(
                (v) => v.id !== tempId && v.id !== saved.id,
              ),
            ];
            this.saveStored(updatedList);
            this.clearDraft();
            localStorage.setItem(MY_VOLUNTEER_KEY, saved.id);
            return saved;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Server error persisting volunteer:", errData);
          throw new Error(
            errData.error || "Failed to save volunteer to database",
          );
        }
      } catch (err: any) {
        console.error("Failed to persist volunteer to database:", err);
        throw err;
      }
    }

    const updatedList = [localVolunteer, ...list];
    this.saveStored(updatedList);
    this.clearDraft();
    return localVolunteer;
  }

  public async updateAsync(
    id: string,
    updates: Partial<Volunteer>,
  ): Promise<Volunteer> {
    const list = this.getStored();
    const index = list.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error(`Volunteer with id ${id} not found`);
    }

    const updated: Volunteer = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (this.isBrowser()) {
      try {
        const res = await fetch(`/api/volunteers/${encodeURIComponent(id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const saved = (await res.json()) as Volunteer;
          if (saved?.id) {
            list[index] = saved;
            this.saveStored(list);
            return saved;
          }
        }
      } catch (err) {
        console.error("Failed to update volunteer in database:", err);
      }
    }

    list[index] = updated;
    this.saveStored(list);
    return updated;
  }

  public update(id: string, updates: Partial<Volunteer>): Volunteer {
    const list = this.getStored();
    const index = list.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error(`Volunteer with id ${id} not found`);
    }

    const updated: Volunteer = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    this.saveStored(list);

    // Persist update to MySQL database
    if (this.isBrowser()) {
      fetch(`/api/volunteers/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).catch((err) =>
        console.error("Failed to update volunteer in MySQL database:", err),
      );
    }

    return updated;
  }

  public toggleStatus(id: string): Volunteer {
    const vol = this.getById(id);
    if (!vol) throw new Error("Volunteer not found");
    const nextStatus: VolunteerStatus =
      vol.status === "active" ? "paused" : "active";
    return this.update(id, { status: nextStatus });
  }

  public setStatus(id: string, status: VolunteerStatus): Volunteer {
    return this.update(id, { status });
  }

  public remove(id: string): boolean {
    const list = this.getStored();
    const filtered = list.filter((v) => v.id !== id);
    if (filtered.length !== list.length) {
      this.saveStored(filtered);

      if (this.isBrowser()) {
        if (localStorage.getItem(MY_VOLUNTEER_KEY) === id) {
          localStorage.removeItem(MY_VOLUNTEER_KEY);
        }
      }

      // Delete from MySQL database
      if (this.isBrowser()) {
        fetch(`/api/volunteers/${encodeURIComponent(id)}`, {
          method: "DELETE",
        }).catch((err) =>
          console.error("Failed to delete volunteer in MySQL database:", err),
        );
      }

      return true;
    }
    return false;
  }

  // --- DRAFT AUTOSAVE SUPPORT ---
  public saveDraft(draft: any): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error("Failed to save volunteer draft:", e);
    }
  }

  public getDraft(): any | null {
    if (!this.isBrowser()) return null;
    try {
      const data = localStorage.getItem(DRAFT_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  public clearDraft(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      console.error("Failed to clear volunteer draft:", e);
    }
  }
}

export const volunteerService = new VolunteerService();
export default volunteerService;
