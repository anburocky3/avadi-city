export interface AuthUser {
  id: string;
  name: string;
  avatar?: string;
  dob: string;
  email: string;
  phone: string;
  gender: string;
  bloodGroup: string;
  wardNumber: number;
  streetName: string;
  isVerified: boolean;
}
