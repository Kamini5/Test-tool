
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPTS = {
  SRS: "You are an expert Business Analyst. Generate a detailed Software Requirements Specification (SRS) in Markdown format. Include sections for Purpose, Scope, Overall Description, Specific Requirements (Functional and Non-functional), and technical constraints.",
  FRS: "You are an expert Systems Architect. Generate a detailed Functional Requirements Specification (FRS) in Markdown format. Focus on 'the system shall' statements, user roles, data flows, and detailed component interactions.",
  TestPlan: "You are a Senior QA Manager. Generate a comprehensive Test Plan in Markdown format. Include test strategy, objectives, scope, tools, roles and responsibilities, entry/exit criteria, and suspension criteria.",
  TestCases: "You are a detailed QA Engineer. Generate a set of test cases in Markdown format. Use a table format with exactly these columns: ID, Test Scenario, Description, Preconditions, Test Steps, Expected Result, Actual Result, Status, Screenshot, and Comment. Include edge cases and negative scenarios.",
  Automation: "You are a Senior Automation Engineer. Generate production-ready automation scripts based on the project requirements. You MUST support specified languages (Java, Python, JavaScript/TypeScript, C#) and frameworks (Selenium with TestNG/JUnit, Cypress, Playwright, Pytest). If the user mentions 'Eclipse', provide specific instructions for setting up the project in the Eclipse IDE (e.g., Maven Project setup, pom.xml configuration). If the user mentions 'XPath', prioritize using robust XPath locators. Include setup instructions, dependencies, and clear code blocks with comments.",
  Environment: "You are a DevOps Engineer. Provide a detailed Test Environment setup guide in Markdown format. Include hardware requirements, software stack, database setup, network configurations, and mock data generation strategies."
};

export async function generateDocument(config: GenerationConfig) {
  const { type, projectName, description, additionalDetails, referenceUrl, image } = config;
  
  const prompt = `
    Project Name: ${projectName}
    Project Description: ${description || "No description provided. Please analyze the URL and/or provided screenshot/image."}
    Reference URL: ${referenceUrl || "None provided"}
    Additional Context: ${additionalDetails || "None"}
    
    Please generate the ${type} document for this project. 
    
    CRITICAL QUALITY GUIDELINE FOR APP LINKS:
    If a Reference URL / App Link is provided:
    1. Utilize your Google Search grounding tool to research and analyze the real-world pages, authentication mechanisms, common selectors, UI components, APIs, and key user workflows of the live website or service.
    2. Make the generated ${type} document (especially TestPlans, TestCases, and Automation scripts) extremely thorough, comprehensive, and specific to the live structure of that actual application.
    3. Include realistic, high-fidelity scenarios (e.g., testing the actual sub-paths like '/login', '/dashboard', testing authentic forms, state persistence, error messages, and API responses).
    4. For Automation scripts and Test Cases, avoid generic placeholding. Instead, detail actual operations, validations, and real elements that fit the target application perfectly.

    CRITICAL QUALITY GUIDELINE FOR UPLOADED SCREENSHOT/IMAGE:
    If a screenshot or image of the app is attached:
    1. Thoroughly analyze the visual interface, elements, labels, layout, buttons, fields, headers, error states, or user flows shown in the screenshot.
    2. Write highly specific, concrete, and precise test scenarios, test cases, or requirements mapping directly to the visible elements, actions, and features shown in the image. Do not use generic placeholders.
    3. For Automation scripts, deduce highly probable elements and locators based on the visual labels, structure, and standard QA best practices (e.g. looking for ID, Name, CSS, or XPath appropriate for the fields shown in the screenshot).
  `;

  try {
    const contents: any[] = [prompt];
    if (image) {
      contents.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPTS[type],
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}
