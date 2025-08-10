import axios from "axios";

// Example Response:
// {
//   "playbook_id": "chad_vyhlidal",
//   "content": "# Chad Vyhlidal Playbook\n\nPlaybook content..."
// }

// Retrieve the content of a specific playbook.
export const getPlaybook = async (id) => {
  if (!id) throw new Error("Playbook ID is required to fetch playbook");

  return await axios
    .get(`${process.env.ASK_WANDA_API_URL}/get_playbook/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    })
    .then((response) => response?.data)
    .catch((error) => {
      console.error(`Error fetching playbook with ID ${id}:`, error);
      throw new Error(`Failed to fetch playbook with ID ${id}`);
    });
};
