import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const analyzeResume = async (file) => {
  if (!file) {
    throw new Error("Please select a file to upload");
  }

  const formData = new FormData();
  formData.append("file", file); 

  try {
    const response = await axios.post(`${API_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data;

    return {
      score: data.score ?? 0,
      overall_assessment: data.overall_assessment ?? "",
      sub_scores: data.sub_scores ?? {},
      comments: data.comments ?? {},
      improvement_tips: data.improvement_tips ?? "",
      line_by_line_feedback: Array.isArray(data.line_by_line_feedback) ? data.line_by_line_feedback : [],
      keyword_suggestions: Array.isArray(data.keyword_suggestions) ? data.keyword_suggestions : [],
      action_verb_alternatives: data.action_verb_alternatives ?? {},
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("An error occurred while analyzing the resume");
  }
};
