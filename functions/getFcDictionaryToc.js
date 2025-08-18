import axios from "axios";

export const getFcDictionaryToc = async () => {
  return await axios
    .post(`${process.env.ASK_WANDA_API_URL}/fc/get_dictionary_toc`, {
      headers: {
        Authorization: `Bearer ${process.env.ASK_WANDA_API_TOKEN}`,
      },
    })
    .then((response) => {
      return response?.data;
    })
    .catch((error) => {
      console.error("Error fetching function call get_dictionary_toc:", error);
      throw new Error("Failed to fetch function call get_dictionary_toc");
    });
};
