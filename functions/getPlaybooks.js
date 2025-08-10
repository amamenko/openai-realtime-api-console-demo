import axios from "axios";

// Example Response:
// {
//   playbooks: [
//     "chad_vyhlidal",
//     "jake_playbook",
//     "julian_playbook",
//     "mitch_playbook",
//   ];
// }

// List all available playbook IDs
export const getPlaybooks = async () => {
  return await axios
    .get(`${process.env.ASK_WANDA_API_URL}/get_playbooks`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    })
    .then((response) => {
      return response?.data?.playbooks || [];
    })
    .catch((error) => {
      console.error("Error fetching playbooks:", error);
      throw new Error("Failed to fetch playbooks");
    });
};
