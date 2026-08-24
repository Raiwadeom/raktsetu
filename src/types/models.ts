export type UserRole = 'user' | 'admin';
export type RequestStatusValue = 'pending' | 'fulfilled' | 'cancelled';
export type DonationTypeValue = 'donated' | 'received';
export type NotificationTypeValue = 'bloodMatch' | 'announcement' | 'verification' | 'general';

export interface AppUser {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  bloodType: string;
  city: string;
  dob: Date | null;
  idCardUrl: string | null;
  profilePhotoUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  isSuspended: boolean;
  expoPushToken: string | null;
  profileComplete: boolean;
  createdAt: Date;
}

export interface BloodRequest {
  id: string;
  requesterUid: string;
  requesterName: string;
  patientName: string;
  unitsRequired: number;
  bloodType: string;
  hospitalName: string;
  location: string;
  contactNumber: string;
  status: RequestStatusValue;
  viewCount: number;
  respondedUids: string[];
  createdAt: Date;
}

export interface NewBloodRequestInput {
  requesterUid: string;
  requesterName: string;
  patientName: string;
  unitsRequired: number;
  bloodType: string;
  hospitalName: string;
  location: string;
  contactNumber: string;
}

export interface DonationRecord {
  id: string;
  userId: string;
  type: DonationTypeValue;
  date: Date;
  units: number;
  hospitalName: string;
  note: string | null;
  linkedRequestId: string | null;
  addedByAdminUid: string;
}

export interface NewDonationRecordInput {
  userId: string;
  type: DonationTypeValue;
  date: Date;
  units: number;
  hospitalName: string;
  note: string | null;
  linkedRequestId: string | null;
  addedByAdminUid: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationTypeValue;
  relatedRequestId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string | null;
  extension?: string;
  size?: number;
}
