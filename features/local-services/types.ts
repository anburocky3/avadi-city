export interface ServiceSkill {
  name: string;
  price: number;
}

export interface ServiceProvider {
  id: string | number;
  name: string;
  category:
    | "Plumbers"
    | "Electricians"
    | "Carpenters"
    | "AC Repair"
    | "Painters"
    | "Mechanics"
    | "Appliance Repair"
    | string;
  phone: string;
  ward: number;
  experience?: string;
  hours?: string;
  specialty?: string;
  rate?: string;
  serviceCharge?: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
  verified?: boolean;
  address?: string;
  skills?: ServiceSkill[];
}
