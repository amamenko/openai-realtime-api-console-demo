import { useState, useCallback } from "react";

export const usePlaybookContent = () => {
  const [playbookContent, setPlaybookContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPlaybookContent = useCallback(async (playbookId) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!playbookId) {
        setPlaybookContent("");
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/playbook/${encodeURIComponent(playbookId)}`);

      if (!res.ok) {
        throw new Error(
          `Failed to fetch playbook content for ID: ${playbookId}`,
        );
      }

      const data = await res.json();
      const raw = data?.content || "";
      const trimmed = raw.slice(0, 8000);
      setPlaybookContent(trimmed);
    } catch (e) {
      console.error("Failed to load playbook content", e);
      setError(e);
      setPlaybookContent("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { playbookContent, loadPlaybookContent, isLoading, error };
};
