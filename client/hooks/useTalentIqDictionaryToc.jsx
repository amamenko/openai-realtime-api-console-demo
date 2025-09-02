import { useState, useCallback } from "react";

// Schema of the TalentIQ dictionary TOC
// {
//   description: string;
//   id: string;
//   subsections: {
//     id: string;
//     title: string;
//   }[];
//   title: string;
//   type: string;
// }[];

export const useTalentIqDictionaryToc = () => {
  const [talentIqDictionaryToc, setTalentIqDictionaryToc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTalentIqDictionaryToc = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/get_talentiq_dictionary_toc");

      if (!res.ok) throw new Error("Failed to fetch TalentIQ dictionary TOC");

      const data = await res.json();
      const content = data?.table_of_contents || "";
      setTalentIqDictionaryToc(content);
    } catch (e) {
      console.error("Failed to load TalentIQ dictionary TOC content", e);
      setError(e);
      setTalentIqDictionaryToc(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    talentIqDictionaryToc,
    loadTalentIqDictionaryToc,
    isLoading,
    error,
  };
};
