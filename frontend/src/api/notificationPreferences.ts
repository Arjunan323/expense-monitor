import api from '../utils/api';

export interface NotificationPreferenceDto { id: number; type: string; emailEnabled: boolean }

export async function listNotificationPrefs(): Promise<NotificationPreferenceDto[]> {
  const { data } = await api.get<NotificationPreferenceDto[]>(`/notifications/preferences`);
  return data;
}

export async function upsertNotificationPref(type: string, emailEnabled: boolean): Promise<NotificationPreferenceDto> {
  const { data } = await api.post<NotificationPreferenceDto>(`/notifications/preferences`, null, { params: { type, emailEnabled } });
  return data;
}
