import { Output, Services } from "~templates-utils";
import { Input } from "./meta";

export function generate(input: Input): Output {
  const services: Services = [];

  // Qdrant Vector Database
  services.push({
    type: "app",
    data: {
      serviceName: input.qdrantServiceName,
      source: {
        type: "image",
        image: input.qdrantServiceImage || "qdrant/qdrant:latest",
      },
      domains: [
        {
          host: `qdrant-$(EASYPANEL_DOMAIN)`,
          port: 6333,
        },
      ],
      mounts: [
        {
          type: "volume",
          name: "qdrant-data",
          mountPath: "/qdrant/storage",
        },
      ],
    },
  });

  // Memory MCP Service
  services.push({
    type: "app",
    data: {
      serviceName: input.memoryServiceName,
      source: {
        type: "image",
        image:
          input.memoryServiceImage || "ghcr.io/context-engine/memory:latest",
      },
      env: [
        `QDRANT_HOST=${input.qdrantServiceName}`,
        `QDRANT_PORT=6333`,
        `PORT=8000`,
      ].join("\n"),
      domains: [
        {
          host: `memory-$(EASYPANEL_DOMAIN)`,
          port: 8000,
        },
      ],
    },
  });

  // Indexer MCP Service
  services.push({
    type: "app",
    data: {
      serviceName: input.indexerServiceName,
      source: {
        type: "image",
        image:
          input.indexerServiceImage || "ghcr.io/context-engine/indexer:latest",
      },
      env: [
        `QDRANT_HOST=${input.qdrantServiceName}`,
        `QDRANT_PORT=6333`,
        `MEMORY_HOST=${input.memoryServiceName}`,
        `MEMORY_PORT=8000`,
        `PORT=8001`,
      ].join("\n"),
      domains: [
        {
          host: `indexer-$(EASYPANEL_DOMAIN)`,
          port: 8001,
        },
      ],
    },
  });

  // Upload Service
  services.push({
    type: "app",
    data: {
      serviceName: input.uploadServiceName,
      source: {
        type: "image",
        image:
          input.uploadServiceImage ||
          "ghcr.io/context-engine/upload-service:latest",
      },
      env: [
        `INDEXER_HOST=${input.indexerServiceName}`,
        `INDEXER_PORT=8001`,
        `PORT=8004`,
      ].join("\n"),
      domains: [
        {
          host: `$(EASYPANEL_DOMAIN)`,
          port: 8004,
        },
      ],
      mounts: [
        {
          type: "volume",
          name: "uploads",
          mountPath: "/app/uploads",
        },
      ],
    },
  });

  return { services };
}
