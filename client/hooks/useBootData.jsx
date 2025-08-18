import { useState, useEffect } from "react";

// Custom hook to fetch initial boot data
export const useBootData = () => {
  const [playbookIds, setPlaybookIds] = useState([]);
  const [functionsSystemPrompt, setFunctionsSystemPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playbooksResponse, sysPromptFunctionsResponse] =
          await Promise.all([
            fetch("/playbooks"),
            fetch("/sys_prompt_functions"),
          ]);

        if (!playbooksResponse.ok || !sysPromptFunctionsResponse.ok) {
          throw new Error("Initial boot data network response failed.");
        }

        const [playbooks, sysPromptFunctions] = await Promise.all([
          playbooksResponse.json(),
          sysPromptFunctionsResponse.json(),
        ]);

        setPlaybookIds(playbooks || []);
        setFunctionsSystemPrompt(sysPromptFunctions.system_prompt || "");
      } catch (err) {
        console.error("Boot fetch failed", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { playbookIds, functionsSystemPrompt, isLoading, error };
};
