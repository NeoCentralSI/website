// Topic Types for management
export interface Topic {
  id: string;
  name: string;
  scienceGroupId: string | null;
  scienceGroup: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  thesisCount: number;
  templateCount: number;
}

export interface CreateTopicDto {
  name: string;
  scienceGroupId: string;
}

export interface UpdateTopicDto {
  name?: string;
  scienceGroupId?: string;
}

export interface BulkDeleteResult {
  deleted: number;
  failed: number;
  failedNames: string[];
}
