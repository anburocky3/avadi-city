import {
  DonationRequest,
  DonationStatus,
  DonationReport,
} from "@/types/donation";
import { seedDonationRequests } from "@/data/seed";

const STORAGE_KEY = "avadi_donation_requests";
const DRAFT_KEY = "avadi_donation_draft";

class DonationService {
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  private getStored(): DonationRequest[] {
    if (!this.isBrowser()) {
      return seedDonationRequests;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedDonationRequests));
        return seedDonationRequests;
      }
      return JSON.parse(data) as DonationRequest[];
    } catch (e) {
      console.error("Failed to read donation requests from localStorage:", e);
      return seedDonationRequests;
    }
  }

  private saveStored(requests: DonationRequest[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch (e) {
      console.error("Failed to save donation requests to localStorage:", e);
    }
  }

  /**
   * Syncs donation requests with MySQL database via /api/donations
   */
  public async syncWithDb(): Promise<DonationRequest[]> {
    if (!this.isBrowser()) return this.getStored();
    try {
      const res = await fetch("/api/donations");
      if (res.ok) {
        const data = (await res.json()) as DonationRequest[];
        if (Array.isArray(data) && data.length > 0) {
          this.saveStored(data);
          return data;
        }
      }
    } catch (e) {
      console.warn("Could not sync donations with database, using local cache:", e);
    }
    return this.getStored();
  }

  public list(): DonationRequest[] {
    return this.getStored();
  }

  public getById(id: string): DonationRequest | null {
    const list = this.getStored();
    return list.find((req) => req.id === id) || null;
  }

  public getByUser(userId: string): DonationRequest[] {
    if (!userId) return [];
    const list = this.getStored();
    return list.filter((req) => req.createdBy === userId);
  }

  public create(
    data: Omit<DonationRequest, "id" | "createdAt" | "updatedAt" | "status" | "reports"> & {
      status?: DonationStatus;
    },
  ): DonationRequest {
    const list = this.getStored();
    const count = list.length + 1;
    const nextId = `AVC-DON-${String(count).padStart(4, "0")}`;
    const now = new Date().toISOString();

    const newRequest: DonationRequest = {
      ...data,
      id: nextId,
      status: data.status || "approved",
      reports: [],
      createdAt: now,
      updatedAt: now,
    };

    const updatedList = [newRequest, ...list];
    this.saveStored(updatedList);
    this.clearDraft();

    // Persist to MySQL database asynchronously
    if (this.isBrowser()) {
      fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      })
        .then(async (res) => {
          if (res.ok) {
            const saved = (await res.json()) as DonationRequest;
            if (saved?.id) {
              const current = this.getStored().map((req) =>
                req.id === nextId ? saved : req,
              );
              this.saveStored(current);
            }
          }
        })
        .catch((err) =>
          console.error("Failed to persist donation to MySQL database:", err),
        );
    }

    return newRequest;
  }

  public update(id: string, updates: Partial<DonationRequest>): DonationRequest {
    const list = this.getStored();
    const index = list.findIndex((req) => req.id === id);
    if (index === -1) {
      throw new Error(`Donation request with id ${id} not found`);
    }

    const updated: DonationRequest = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    this.saveStored(list);

    // Persist to MySQL database
    if (this.isBrowser()) {
      fetch(`/api/donations/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).catch((err) =>
        console.error("Failed to update donation in MySQL database:", err),
      );
    }

    return updated;
  }

  public updateStatus(id: string, status: DonationStatus): DonationRequest {
    const updated = this.update(id, { status });

    if (this.isBrowser()) {
      fetch(`/api/donations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).catch((err) =>
        console.error("Failed to update donation status in MySQL database:", err),
      );
    }

    return updated;
  }

  public reportRequest(
    id: string,
    reason: string,
    reportedBy?: string,
  ): DonationRequest {
    const req = this.getById(id);
    if (!req) throw new Error("Request not found");

    const newReport: DonationReport = {
      reason,
      reportedAt: new Date().toISOString(),
      reportedBy,
    };

    const updatedReports = [...(req.reports || []), newReport];
    const updated = this.update(id, { reports: updatedReports });

    if (this.isBrowser()) {
      fetch(`/api/donations/${encodeURIComponent(id)}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, reportedBy }),
      }).catch((err) =>
        console.error("Failed to submit donation report to MySQL database:", err),
      );
    }

    return updated;
  }

  public remove(id: string): boolean {
    const list = this.getStored();
    const filtered = list.filter((req) => req.id !== id);
    if (filtered.length !== list.length) {
      this.saveStored(filtered);

      if (this.isBrowser()) {
        fetch(`/api/donations/${encodeURIComponent(id)}`, {
          method: "DELETE",
        }).catch((err) =>
          console.error("Failed to delete donation from MySQL database:", err),
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
      console.error("Failed to save donation draft:", e);
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
      console.error("Failed to clear donation draft:", e);
    }
  }
}

export const donationService = new DonationService();
export default donationService;
