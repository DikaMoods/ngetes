import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { imageBase64, mimeType, prompt } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    const defaultPrompt =
      "Using the model, create a 1/7 scale commercialized figurine of the characters in the picture, in a realistic style, in a real environment. The figurine is placed on a computer desk. The figurine has a round transparent acrylic base, with no text on the base. The content on the computer screen is the Zbrush modeling process of this figurine. Next to the computer screen is a BANDAI-style toy packaging box printed with the original artwork. The packaging features two-dimensional flat illustrations.";

    const contents = [
      { text: prompt || defaultPrompt },
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ];

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: { responseModalities: ["Text", "Image"] },
    });

    const response = await model.generateContent(contents);
    let resultImage, resultText = "";

    for (const part of response.response.candidates[0].content.parts) {
      if (part.text) resultText += part.text;
      else if (part.inlineData) resultImage = part.inlineData.data;
    }

    if (!resultImage) throw new Error("Tidak ada gambar yang dihasilkan.");

    res.status(200).json({
      image: resultImage,
      text: resultText || "Berhasil membuat figurine!",
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
}