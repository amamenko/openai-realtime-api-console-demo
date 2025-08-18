import axios from "axios";

// Example Response:
// { service: 'Ask Wanda API', status: 'healthy' }

// Check if the Wanda API is running
export const wandaHealthCheck = async () => {
  try {
    const response = await axios.get(
      `${process.env.ASK_WANDA_API_URL}/health`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ASK_WANDA_API_TOKEN}`,
        },
      },
    );
    return response?.data || null;
  } catch (error) {
    console.error("Wanda Health Check error:", error);
    throw new Error("Wanda Health Check failed - error");
  }
};
