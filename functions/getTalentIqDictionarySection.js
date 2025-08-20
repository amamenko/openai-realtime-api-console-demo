import axios from "axios";

export const getTalentIqDictionarySection = async (id) => {
  if (!id)
    throw new Error(
      "Section ID is required to get TalentIQ dictionary section!",
    );

  return await axios
    .post(
      `${process.env.ASK_WANDA_API_URL}/get_talentiq_dictionary_section`,
      {
        section_id: id,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ASK_WANDA_API_TOKEN}`,
        },
      },
    )
    .then((response) => {
      return response?.data;
    })
    .catch((error) => {
      console.error(
        "Error fetching function call get_talentiq_dictionary_section:",
        error,
      );
      throw new Error(
        "Failed to fetch function call get_talentiq_dictionary_section",
      );
    });
};
