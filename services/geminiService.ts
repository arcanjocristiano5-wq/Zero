
import { GoogleGenAI, Type } from "@google/genai";
import { Project, FileNode, CloudAIInstance, Platform, Message } from "../types";

const getAIClient = () => {
  // Security Fix: API key MUST be obtained exclusively from the environment variable.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getWindowsGenerationPrompt = (userPrompt: string): string => `
You are an expert Windows application architect specializing in the latest native technologies.
Your task is to generate a complete, ready-to-compile project structure for a native Windows application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Framework:** Use WinUI 3 with the Windows App SDK. The project must be a "Packaged" desktop app.
2.  **Language:** Use C# 12 and XAML.
3.  **Architecture:** Implement the MVVM (Model-View-ViewModel) pattern.
4.  **Database Integration:**
    -   If the prompt implies data storage, use **SQLite** with **Entity Framework Core**.
    -   Generate a \`Data\` folder with a \`DbContext\` class and model classes.
    -   Integrate the database context into the ViewModels for data operations.
    -   The app should be functional with the database integrated.
5.  **UI/UX:** The generated XAML UI must be modern, clean, and follow Microsoft's Fluent Design System principles.
6.  **Project Files:** Generate all necessary files for a compilable Visual Studio project, including .sln, .csproj, App.xaml/cs, MainWindow.xaml/cs, and Package.appxmanifest.
7.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt and compiles without errors.
8.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getWebGenerationPrompt = (userPrompt: string): string => `
You are an expert full-stack web developer specializing in the React ecosystem.
Your task is to generate a complete, ready-to-run project structure for a modern web application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Framework:** Use Next.js 14 with the App Router.
2.  **Language:** Use TypeScript.
3.  **Styling:** Use Tailwind CSS.
4.  **Database Integration:**
    -   Based on the user prompt, determine if a database is needed.
    -   If so, use **Prisma ORM** with a **PostgreSQL** database.
    -   Generate a complete \`prisma/schema.prisma\` file that models the data.
    -   Create a database client/connection file (e.g., \`lib/db.ts\`).
    -   Generate seed data if appropriate (\`prisma/seed.ts\`).
    -   Integrate database calls into the generated application logic (e.g., Server Components, API routes).
    -   Include a \`.env.example\` file with the \`DATABASE_URL\`.
    -   The generated app must be fully functional with the database integrated.
5.  **Architecture:** Create a logical folder structure (e.g., \`app/\`, \`components/\`, \`lib/\`).
6.  **UI/UX:** The generated React components should be functional, well-structured, and aesthetically pleasing.
7.  **Project Files:** Generate all necessary configuration files, including \`package.json\` (with dependencies like react, next, tailwindcss, typescript, prisma), \`tailwind.config.ts\`, and \`tsconfig.json\`.
8.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt and can be run with \`npm install && npx prisma db push && npm run dev\`.
9.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getAndroidGenerationPrompt = (userPrompt: string): string => `
You are an expert Android developer specializing in native application development.
Your task is to generate a complete, ready-to-compile project structure for a native Android application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Language:** Use Kotlin.
2.  **UI Toolkit:** Use Jetpack Compose for the UI, following Material 3 design principles.
3.  **Architecture:** Implement the MVVM pattern with ViewModels, Repositories, and a Model layer.
4.  **Database Integration:**
    -   If the prompt implies data storage, use the **Room Persistence Library**.
    -   Generate the Entity, DAO, and Database classes.
    -   Use Kotlin Coroutines and Flow for asynchronous database operations.
    -   Integrate the database access into the Repository and ViewModel layers.
5.  **Project Files:** Generate a standard Gradle project structure. This includes \`build.gradle.kts\` (with Room and Compose dependencies), \`AndroidManifest.xml\`, and source files under \`app/src/main/java/\`.
6.  **Functionality:** The generated code should represent a functional starting point that reflects the user's prompt and would compile in Android Studio.
7.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getIosGenerationPrompt = (userPrompt: string): string => `
You are an expert iOS developer specializing in native application development with Swift.
Your task is to generate a complete, ready-to-compile project structure for a native iOS application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Language:** Use Swift 5.
2.  **UI Toolkit:** Use SwiftUI for the entire UI.
3.  **Architecture:** Implement the MVVM pattern.
4.  **Database Integration:**
    -   If the prompt implies data storage, use **SwiftData**.
    -   Define the data model using the \`@Model\` macro.
    -   Set up the model container in the main App struct.
    -   Use \`@Query\` and the model context within SwiftUI views to interact with the data.
5.  **Project Files:** Generate the essential files for an Xcode project. This includes \`[AppName]App.swift\` for the app entry point, \`ContentView.swift\`, and other necessary view and viewmodel files.
6.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt and would compile in Xcode.
7.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getMacosGenerationPrompt = (userPrompt: string): string => `
You are an expert macOS developer specializing in native application development with Swift.
Your task is to generate a complete, ready-to-compile project structure for a native macOS application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Language:** Use Swift 5.
2.  **UI Toolkit:** Use SwiftUI.
3.  **Architecture:** Implement the MVVM pattern.
4.  **Database Integration:**
    -   If the prompt implies data storage, use **SwiftData**.
    -   Define the data model using the \`@Model\` macro.
    -   Set up the model container in the main App struct.
    -   Use \`@Query\` and the model context within SwiftUI views to interact with the data.
5.  **Project Files:** Generate the essential files for a macOS Xcode project, including \`[AppName]App.swift\`, \`ContentView.swift\`, etc.
6.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt and would compile in Xcode.
7.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getLinuxGenerationPrompt = (userPrompt: string): string => `
You are an expert Linux desktop application developer.
Your task is to generate a complete, ready-to-compile project structure for a native Linux desktop application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Language:** Use Python 3.
2.  **UI Toolkit:** Use GTK4 with libadwaita for a modern look and feel.
3.  **Build System:** Use the Meson build system.
4.  **Database Integration:**
    -   If the prompt implies data storage, use **SQLite** with the built-in \`sqlite3\` Python module.
    -   Create a simple data access layer to handle database operations.
    -   Integrate database calls into the application logic.
5.  **Project Files:** Generate all necessary files, including \`meson.build\`, source files in a subdirectory, \`.ui\` files for UI definitions, and a main application class.
6.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt.
7.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getDefaultGenerationPrompt = (userPrompt: string, platform: string): string => `
You are an expert software architect.
Your task is to generate a complete, ready-to-use project structure for an application on the specified platform based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Target Platform:** "${platform}"

**Strict Requirements:**
1.  **Language & Framework:** Choose the most common and modern language and framework suitable for the target platform.
2.  **Architecture:** Implement a clean and scalable architecture pattern (e.g., MVVM, MVC).
3.  **Database Integration:**
    -   If the prompt implies data storage, choose a suitable database technology (e.g., SQLite, PostgreSQL).
    -   Generate all necessary files for database schema, connection, and models.
    -   Integrate the database functionally into the application logic.
4.  **Project Files:** Generate all necessary configuration and source files for a functional starting point.
5.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt.
6.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;


export const generateAppStructure = async (prompt: string, platform: string, project: Project): Promise<any> => {
  const ai = getAIClient();
  const activeProvider = project.config.cloudAIProviders.find(p => p.id === project.config.activeAIProviderId);
  const model = activeProvider?.model || 'gemini-3-pro-preview';

  let generationPrompt = '';
  switch (platform) {
    case Platform.WINDOWS:
      generationPrompt = getWindowsGenerationPrompt(prompt);
      break;
    case Platform.WEB:
      generationPrompt = getWebGenerationPrompt(prompt);
      break;
    case Platform.ANDROID:
      generationPrompt = getAndroidGenerationPrompt(prompt);
      break;
    case Platform.IOS:
      generationPrompt = getIosGenerationPrompt(prompt);
      break;
    case Platform.MACOS:
      generationPrompt = getMacosGenerationPrompt(prompt);
      break;
    case Platform.LINUX:
      generationPrompt = getLinuxGenerationPrompt(prompt);
      break;
    default:
      generationPrompt = getDefaultGenerationPrompt(prompt, platform);
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: generationPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING },
                content: { type: Type.STRING },
                language: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  
  try {
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return {};
  } catch (e) {
    console.error("Failed to parse JSON response:", e);
    return {};
  }
};

export const getSuggestions = async (project: Project): Promise<string> => {
  const ai = getAIClient();
  const activeProvider = project.config.cloudAIProviders.find(p => p.id === project.config.activeAIProviderId);
  const model = activeProvider?.model || 'gemini-3-flash-preview';

  const response = await ai.models.generateContent({
    model: model,
    contents: `Review this project and suggest 3 technical improvements for performance and security: 
    Project: ${project.name}
    Platform: ${project.config.targetPlatform}
    Structure Overview: ${JSON.stringify(project.structure.map(n => n.name))}`,
  });
  
  return response.text || "No suggestions available at this time.";
};

export const fixCode = async (code: string, error: string, project: Project): Promise<string> => {
  const activeSecurityHelper = project.config.helperAIs.find(
    h => h.task === 'Security Scan' && h.isActive && h.status === 'downloaded'
  );

  let systemPrompt = `Fix the following code which has this simulated error: ${error}\n\nCode:\n${code}`;
  
  if (activeSecurityHelper) {
    console.log(`Using helper AI: ${activeSecurityHelper.name} to help fix the code.`);
    systemPrompt = `You are an expert security analyst. A piece of code has been flagged with the error "${error}". Your task is to fix it, prioritizing security best practices. \n\nCode:\n${code}`;
  }

  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: systemPrompt,
  });
  
  return response.text || code;
};

export const optimizeAndCorrectCode = async (fullCode: string, project: Project): Promise<string> => {
    const activeOptimizer = project.config.helperAIs.find(
        h => h.task === 'Code Optimization' && h.isActive && h.status === 'downloaded'
    );

    let systemPrompt = `You are an expert software engineer. Analyze, optimize, and correct the following collection of files from a software project. Refactor for performance, fix potential bugs, and enhance security. Return only the complete, corrected code, maintaining the original file separation comments.`;

    if (activeOptimizer) {
        console.log(`Using helper AI: ${activeOptimizer.name} for code optimization.`);
        systemPrompt = `You are ${activeOptimizer.name}, an AI specialized in high-performance code optimization. ${systemPrompt}`;
    }

  const ai = getAIClient();
  const activeProvider = project.config.cloudAIProviders.find(p => p.id === project.config.activeAIProviderId);
  const model = activeProvider?.model || 'gemini-3-pro-preview';

  const response = await ai.models.generateContent({
    model: model,
    contents: `${systemPrompt}
    
    Project context:
    - Name: ${project.name}
    - Target Platform: ${project.config.targetPlatform}
    
    Codebase:
    ---
    ${fullCode}`,
  });
  
  return response.text || fullCode;
};

export const generateBuildFiles = async (project: Project, format: string): Promise<{ path: string; content: string }[]> => {
    const ai = getAIClient();
    const activeProvider = project.config.cloudAIProviders.find(p => p.id === project.config.activeAIProviderId);
    const model = activeProvider?.model || 'gemini-3-pro-preview';
  
    const projectFilesSummary: { path: string }[] = [];
    const traverse = (nodes: FileNode[], path: string) => {
        nodes.forEach(node => {
            const currentPath = path ? `${path}/${node.name}` : node.name;
            projectFilesSummary.push({ path: currentPath });
            if (node.children) {
                traverse(node.children, currentPath);
            }
        });
    };
    traverse(project.structure, '');
  
    const buildPrompt = `
You are a build engineering expert and software architect. Your task is to generate the necessary configuration and script files to compile or package a given software project for a specific target format.

**Project Context:**
- **Project Name:** "${project.name}"
- **Target Platform:** "${project.config.targetPlatform}"
- **Selected Export Format:** "${format}"
- **Project File Structure:**
\`\`\`json
${JSON.stringify(projectFilesSummary, null, 2)}
\`\`\`

**Instructions:**
1.  Analyze the project context and the target export format ("${format}"). The full code is not provided, only the file structure. Infer the necessary build steps from the file names and platform.
2.  Generate a set of NEW files required for the build process. Do NOT output any of the original files.
3.  For "EXE (Tradicional)" on a C#/.NET project, generate a \`build.bat\` that uses \`dotnet publish\`. For other project types, suggest a suitable packager script (e.g., for Inno Setup or NSIS).
4.  For "PWA (Manifests)", generate a \`manifest.json\`, a basic service worker file (\`sw.js\`), and instructions on where to include them.
5.  For container formats like "OCI-Images (Docker/Podman)", generate a complete and working \`Dockerfile\` and a \`.dockerignore\` file.
6.  Provide clear, step-by-step instructions in a \`BUILD_INSTRUCTIONS.md\` file on how to use the generated files to complete the build process on a user's local machine. This is the most important file.
7.  Return ONLY a single, valid JSON object containing a flat list of the NEW files to be added to the project.

**Output Format:**
Return a single JSON object with a "files" key, which is an array of objects, each with a "path" and "content" property.
`;
  
    const response = await ai.models.generateContent({
      model: model,
      contents: buildPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["path", "content"]
              }
            }
          }
        }
      }
    });
  
    try {
        const text = response.text;
        if (text) {
          const result = JSON.parse(text);
          return result.files || [];
        }
        return [];
      } catch (e) {
        console.error("Failed to parse JSON response for build files:", e);
        return [];
      }
  };
  
export const generateTestFile = async (fileContent: string, fileName: string, project: Project): Promise<{ path: string; content: string }> => {
    const ai = getAIClient();
    const activeProvider = project.config.cloudAIProviders.find(p => p.id === project.config.activeAIProviderId);
    const model = activeProvider?.model || 'gemini-3-pro-preview';

    let testFramework = "Jest with React Testing Library";
    // This could be expanded based on project.config.targetPlatform
    switch(project.config.targetPlatform) {
        case Platform.ANDROID:
            testFramework = "JUnit and Mockito";
            break;
        case Platform.IOS:
            testFramework = "XCTest";
            break;
        case Platform.WINDOWS:
            testFramework = "MSTest or xUnit";
            break;
        // default is web
    }

    const testPrompt = `
You are an expert QA Engineer and software developer. Your task is to write a comprehensive unit test file for the given source code file.

**Project Context:**
- **Project Name:** "${project.name}"
- **Target Platform:** "${project.config.targetPlatform}"
- **Testing Framework:** "${testFramework}"

**Source File Name:** \`${fileName}\`

**Source File Content:**
\`\`\`
${fileContent}
\`\`\`

**Instructions:**
1.  Analyze the source file content.
2.  Identify the key functionalities, components, and logic that need to be tested.
3.  Write a complete and runnable test file.
4.  Include tests for primary functionality, edge cases, and potential error conditions.
5.  Adhere to the best practices of the specified testing framework.
6.  Suggest an appropriate file name for the test file (e.g., \`${fileName.replace(/\.(tsx|ts|js)$/, '.test.$1')}\`).
7.  Return ONLY a single, valid JSON object containing the suggested "path" (the filename) and "content" of the new test file.

**Output Format:**
Return a single JSON object with a "path" key (string) and a "content" key (string).
`;

    const response = await ai.models.generateContent({
        model: model,
        contents: testPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    path: { type: Type.STRING },
                    content: { type: Type.STRING }
                },
                required: ["path", "content"]
            }
        }
    });

    try {
        const text = response.text;
        if (text) {
            const result = JSON.parse(text);
            return result;
        }
        throw new Error("No response from AI for test generation.");
    } catch (e) {
        console.error("Failed to parse JSON response for test file:", e);
        throw e;
    }
};

export const refactorCodeSelection = async (selection: string, fullCode: string, project: Project): Promise<string> => {
    const ai = getAIClient();
    const activeProvider = project.config.cloudAIProviders.find(p => p.id === project.config.activeAIProviderId);
    const model = activeProvider?.model || 'gemini-3-pro-preview';
    
    const refactorPrompt = `
You are an expert senior software engineer and code architect. Your task is to refactor a selected piece of code within the context of its full file.

**Project Context:**
- **Project Name:** "${project.name}"
- **Target Platform:** "${project.config.targetPlatform}"
- **Language:** "${project.config.language}"

**Full File Content (for context):**
\`\`\`
${fullCode}
\`\`\`

---

**Code Selection to Refactor:**
\`\`\`
${selection}
\`\`\`

---

**Instructions:**
1.  Analyze the "Code Selection to Refactor" in the context of the "Full File Content".
2.  Refactor ONLY the selected code. Do not include any code outside the original selection in your response.
3.  The goal is to improve readability, performance, and adherence to best practices for the language and platform.
4.  **Crucially, you must not change the code's functionality or its public API.**
5.  Return ONLY the refactored code snippet as a raw string, without any explanations, markdown formatting, or code fences (like \`\`\`).
`;

    const response = await ai.models.generateContent({
        model: model,
        contents: refactorPrompt,
    });
    
    return response.text || selection;
};

export const explainCodeSelection = async (selection: string, fullCode: string, project: Project): Promise<string> => {
    const ai = getAIClient();
    const activeProvider = project.config.cloudAIProviders.find(p => p.id === project.config.activeAIProviderId);
    const model = activeProvider?.model || 'gemini-3-flash-preview';
    
    const explainPrompt = `
You are an expert senior software engineer and an excellent communicator. Your task is to explain a selected piece of code to another developer.

**Project Context:**
- **Project Name:** "${project.name}"
- **Target Platform:** "${project.config.targetPlatform}"
- **Language:** "${project.config.language}"

**Full File Content (for context only):**
\`\`\`
${fullCode}
\`\`\`

---

**Code Selection to Explain:**
\`\`\`
${selection}
\`\`\`

---

**Instructions:**
1.  Analyze the "Code Selection to Explain" within the context of the "Full File Content".
2.  Provide a clear and concise explanation of what the selected code does.
3.  Describe its purpose, the logic it follows, and any important side effects or return values.
4.  Format your answer clearly, using markdown for code snippets if necessary, but keep the main text conversational.
5.  The explanation should be easy for another developer to understand.
`;

    const response = await ai.models.generateContent({
        model: model,
        contents: explainPrompt,
    });
    
    return response.text || "Sorry, I couldn't generate an explanation for this code.";
};

export const getArchitectResponse = async (prompt: string, history: Message[], project: Project): Promise<string> => {
  const ai = getAIClient();
  const activeProvider = project.config.cloudAIProviders.find(p => p.id === project.config.activeAIProviderId);
  const model = activeProvider?.model || 'gemini-3-pro-preview';

  const fileStructure = JSON.stringify(project.structure.map(node => ({ name: node.name, type: node.type })));

  const systemInstruction = `You are the AI Architect for ZERO, an AI-powered IDE. You are a conversational partner to the developer.
- Your goal is to help them build, understand, and improve their project.
- You have context about the current project:
  - Name: ${project.name}
  - Platform: ${project.config.targetPlatform}
  - File Structure: ${fileStructure}
- Be concise, helpful, and provide code snippets using Markdown when appropriate.
- You can answer questions, suggest code, explain concepts, and help debug.
- The user's message history is provided for context.
`;
  
  const conversationHistory = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  const response = await ai.models.generateContent({
    model: model,
    contents: {
        parts: [{ text: prompt }],
        // TODO: Figure out how to send conversation history correctly
    },
    config: {
        systemInstruction: systemInstruction,
    }
  });

  return response.text || "I'm sorry, I'm having trouble responding right now.";
};

export const getInlineSuggestions = async (code: string, fileName: string, project: Project): Promise<any[]> => {
    const ai = getAIClient();
    const activeProvider = project.config.cloudAIProviders.find(p => p.id === project.config.activeAIProviderId);
    const model = activeProvider?.model || 'gemini-3-flash-preview';

    const prompt = `
You are an expert code reviewer and AI assistant. Analyze the following code file and identify up to 3 potential improvements, such as bugs, performance optimizations, or refactoring opportunities for better readability.

**Project Context:**
- **Platform:** ${project.config.targetPlatform}
- **File Name:** ${fileName}

**Code to Analyze:**
\`\`\`
${code}
\`\`\`

**Instructions:**
1.  Review the code for issues.
2.  For each issue found, provide the line number, a short description of the suggestion, and the exact code that should replace the line.
3.  If no issues are found, return an empty array.
4.  Return ONLY a single, valid JSON object containing a list of suggestions.

**Output Format:**
Return a single JSON object with a "suggestions" key. The value should be an array of objects, each with "lineNumber" (number), "suggestion" (string), and "replacementCode" (string).
`;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                lineNumber: { type: Type.NUMBER },
                                suggestion: { type: Type.STRING },
                                replacementCode: { type: Type.STRING },
                            },
                            required: ["lineNumber", "suggestion", "replacementCode"],
                        },
                    },
                },
            },
        },
    });

    try {
        const text = response.text;
        if (text) {
            const result = JSON.parse(text);
            return result.suggestions || [];
        }
        return [];
    } catch (e) {
        console.error("Failed to parse JSON for inline suggestions:", e);
        return [];
    }
};
