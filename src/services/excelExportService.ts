import * as XLSX from 'xlsx';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { formatDate } from '../utils/formatters';
import type { AppUser } from '../types/models';

export async function exportUsersToExcel(users: AppUser[]): Promise<string> {
  const rows = users.map((u) => ({
    'Full Name': u.fullName,
    Email: u.email,
    'Blood Type': u.bloodType,
    Gender: u.gender,
    Phone: u.phone,
    City: u.city,
    Verified: u.isVerified ? 'Yes' : 'No',
    Suspended: u.isSuspended ? 'Yes' : 'No',
    'Registration Date': formatDate(u.createdAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rakt Setu Users');

  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' }) as string;
  const file = new File(Paths.cache, `rakt_setu_users_${Date.now()}.xlsx`);
  file.create({ overwrite: true });
  file.write(base64, { encoding: 'base64' });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Rakt Setu — Registered Users Export',
    });
  }

  return file.uri;
}
