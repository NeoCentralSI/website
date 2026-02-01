// Topic Types for management
export interface Topic {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  thesisCount: number;
  templateCount: number;
}

export interface CreateTopicDto {
  name: string;
}

export interface UpdateTopicDto {
  name?: string;
}

export interface BulkDeleteResult {
  deleted: number;
  failed: number;
  failedNames: string[];
}
