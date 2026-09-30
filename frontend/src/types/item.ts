export type ItemStatus = "todo" | "doing" | "done";
export interface Item {
    id: string;
    name: string;
    completed: boolean;
    status?: ItemStatus;
    assigneeId?: string | null;
}