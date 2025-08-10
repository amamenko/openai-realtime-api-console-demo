import axios from "axios";

// Example Response:
// {
//   "system_prompt": "Agent Instructions\n----\nDialog Trees\n----\nTalentIQ Dictionary\n----\n# Chad Vyhlidal Playbook\n\nPlaybook content...\n----",
//   "playbook_id": "chad_vyhlidal"
// }

// Get the complete system prompt (~163K+ characters) for a specific playbook
// Includes Agent Instructions, Dialog Trees, TalentIQ Dictionary for initializing AI agents
export const getSystemPrompt = async (id) => {
  if (!id) throw new Error("Playbook ID is required to fetch system prompt");

  return await axios
    .get(`${process.env.ASK_WANDA_API_URL}/get_sys_prompt/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    })
    .then((response) => {
      return response?.data;
    })
    .catch((error) => {
      console.error("Error fetching system prompt:", error);
      throw new Error("Failed to fetch system prompt");
    });
};
