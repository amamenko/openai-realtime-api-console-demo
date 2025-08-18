import axios from "axios";

// Example Response:
// {
//   "system_prompt": "Agent Instructions\n----\nDialog Trees\n----\nTalentIQ Dictionary\n----\n# Chad Vyhlidal Playbook\n\nPlaybook content...\n----"
// }

// Gets initial system prompt functions for model
export const getSystemPromptFunctions = async (id) => {
  return await axios
    .get(`${process.env.ASK_WANDA_API_URL}/get_sys_prompt_functions`, {
      headers: {
        Authorization: `Bearer ${process.env.ASK_WANDA_API_TOKEN}`,
      },
    })
    .then((response) => {
      return response?.data;
    })
    .catch((error) => {
      console.error("Error fetching system prompt functions:", error);
      throw new Error("Failed to fetch system prompt functions");
    });
};
