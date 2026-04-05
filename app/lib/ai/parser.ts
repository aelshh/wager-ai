import path from "path";

export type AiFile = {
  path: string;
  content: string;
};

export type AiResponse = {
  explanation: string;
  files: AiFile[];
};

function extractJson(raw: string) {
  const cleaned = cleanRawText(raw);
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.indexOf("}");

  if (firstBrace == -1 || lastBrace == -1) {
    throw new Error("No JSON found in AI response");
  }
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function cleanRawText(text: string) {
  return text
    .replace(/<think>.*?<\/think>/gs, "")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function safeParse(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON from AI");
  }
}

function validateAIResponse(data: unknown): AiResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Response is not an object");
  }

  const obj = data as {
    explanation?: unknown;
    files?: unknown;
  };

  if (typeof obj.explanation !== "string") {
    throw new Error("Missing Explanation");
  }
  if (!Array.isArray(obj.files)) {
    throw new Error("Files must be an array");
  }

  return {
    explanation: obj.explanation,
    files: obj.files.map((file, i) => {
      if (typeof file.path !== "string") {
        throw new Error(`File: ${i}Missing file path`);
      }
      if (typeof file.content !== "string") {
        throw new Error(`File: ${i}Missing file content`);
      }
      return {
        path: file.path,
        content: file.content,
      };
    }),
  };
}

function sanitizePath(filePath: string) {
  const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");
  if (!normalized.startsWith("src") && normalized !== "index.html") {
    throw new Error("Invalid file path");
  }

  return normalized;
}
function sanitizeContent(content: string) {
  return content.trim();
}

export function parseAIResponse(raw: string) {
  const jsonString = extractJson(raw);
  const parsed = safeParse(jsonString);
  const validated = validateAIResponse(parsed);

  const files = validated.files.map((file) => ({
    path: sanitizePath(file.path),
    content: sanitizeContent(file.content),
  }));

  return {
    explanation: validated.explanation.trim(),
    files,
  };
}
