import { getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";
import type { Topic, CreateTopicDto, UpdateTopicDto, BulkDeleteResult } from "@/types/topic.types";

// API Endpoints
const ENDPOINTS = {
  TOPICS: "/topics",
  TOPIC_DETAIL: (id: string) => `/topics/${id}`,
  TOPICS_BULK: "/topics/bulk",
};

/**
 * Get all thesis topics
 */
export async function getTopics(): Promise<Topic[]> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TOPICS));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil daftar topik");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get topic by ID
 */
export async function getTopicById(id: string): Promise<Topic> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TOPIC_DETAIL(id)));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil detail topik");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create new topic (Sekretaris Departemen only)
 */
export async function createTopic(data: CreateTopicDto): Promise<Topic> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TOPICS), {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal membuat topik");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update topic (Sekretaris Departemen only)
 */
export async function updateTopic(id: string, data: UpdateTopicDto): Promise<Topic> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TOPIC_DETAIL(id)), {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal memperbarui topik");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Delete topic (Sekretaris Departemen only)
 */
export async function deleteTopic(id: string): Promise<void> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TOPIC_DETAIL(id)), {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menghapus topik");
  }
}

/**
 * Bulk delete topics (Sekretaris Departemen only)
 */
export async function bulkDeleteTopics(ids: string[]): Promise<BulkDeleteResult> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TOPICS_BULK), {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menghapus topik");
  }

  const result = await response.json();
  return result.data;
}
