
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string | null;
  role: "OWNER" | "EDITOR" | "VIEWER";
  isOwner: boolean;
  canEdit: boolean;
  canManage: boolean;
};