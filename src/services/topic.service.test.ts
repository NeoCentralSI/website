import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Topic } from "@/types/topic.types";

vi.mock("./auth.service", () => ({
  apiRequest: vi.fn(),
}));

const { apiRequest } = await import("./auth.service");
const topicService = await import("./topic.service");

const mockedApiRequest = vi.mocked(apiRequest);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("topicService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes nested topic list payloads", async () => {
    const topic: Topic = {
      id: "topic-1",
      name: "Machine Learning",
      scienceGroupId: "sg-1",
      scienceGroup: { id: "sg-1", name: "Sistem Cerdas" },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      thesisCount: 0,
      templateCount: 0,
    };
    mockedApiRequest.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { topics: [topic] } }),
    );

    await expect(topicService.getTopics()).resolves.toEqual([topic]);
  });
});
