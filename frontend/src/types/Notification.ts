export type ApiNotification = {
  id: string;
  userId: string;
  type: string;
  eventId: string;
  data: unknown;
  read: boolean;
  createdAt: string;
};
