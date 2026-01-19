import { GoogleGenAI, Type } from "@google/genai";
import { Project, FileNode, CloudAIInstance, Platform } from "../types";

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
4.  **UI/UX:** The generated XAML UI must be modern, clean, and follow Microsoft's Fluent Design System principles (e.g., NavigationView, Mica materials).
5.  **Project Files:** Generate all necessary files for a compilable Visual Studio project, including .sln, .csproj, App.xaml/cs, MainWindow.xaml/cs, and Package.appxmanifest.
6.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt and compiles without errors.
7.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getWebGenerationPrompt = (userPrompt: string): string => `
You are an expert full-stack web developer specializing in the React ecosystem.
Your task is to generate a complete, ready-to-run project structure for a modern web application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Framework:** Use Next.js 14 with the App Router.
2.  **Language:** Use TypeScript.
3.  **Styling:** Use Tailwind CSS.
4.  **Architecture:** Create a logical folder structure (e.g., \`app/\`, \`components/\`, \`lib/\`).
5.  **UI/UX:** The generated React components should be functional, well-structured, and aesthetically pleasing.
6.  **Project Files:** Generate all necessary configuration files, including \`package.json\` (with dependencies like react, next, tailwindcss, typescript), \`tailwind.config.ts\`, and \`tsconfig.json\`.
7.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt and can be run with \`npm install && npm run dev\`.
8.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getAndroidGenerationPrompt = (userPrompt: string): string => `
You are an expert Android developer specializing in native application development.
Your task is to generate a complete, ready-to-compile project structure for a native Android application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Language:** Use Kotlin.
2.  **UI Toolkit:** Use Jetpack Compose for the UI, following Material 3 design principles.
3.  **Architecture:** Implement the MVVM pattern with ViewModels, Repositories, and a simple Model layer.
4.  **Project Files:** Generate a standard Gradle project structure. This includes \`build.gradle.kts\` (for both project and app module, with Compose dependencies), \`AndroidManifest.xml\`, and source files under \`app/src/main/java/\`.
5.  **Functionality:** The generated code should represent a functional starting point that reflects the user's prompt and would compile in Android Studio.
6.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getIosGenerationPrompt = (userPrompt: string): string => `
You are an expert iOS developer specializing in native application development with Swift.
Your task is to generate a complete, ready-to-compile project structure for a native iOS application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Language:** Use Swift 5.
2.  **UI Toolkit:** Use SwiftUI for the entire UI.
3.  **Architecture:** Implement the MVVM pattern.
4.  **Project Files:** Generate the essential files for an Xcode project. This includes \`[AppName]App.swift\` for the app entry point, \`ContentView.swift\`, and other necessary view and viewmodel files.
5.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt and would compile in Xcode.
6.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getMacosGenerationPrompt = (userPrompt: string): string => `
You are an expert macOS developer specializing in native application development with Swift.
Your task is to generate a complete, ready-to-compile project structure for a native macOS application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Language:** Use Swift 5.
2.  **UI Toolkit:** Use SwiftUI.
3.  **Architecture:** Implement the MVVM pattern.
4.  **Project Files:** Generate the essential files for a macOS Xcode project, including \`[AppName]App.swift\`, \`ContentView.swift\`, etc.
5.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt and would compile in Xcode.
6.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getLinuxGenerationPrompt = (userPrompt: string): string => `
You are an expert Linux desktop application developer.
Your task is to generate a complete, ready-to-compile project structure for a native Linux desktop application based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Strict Requirements:**
1.  **Language:** Use Python 3.
2.  **UI Toolkit:** Use GTK4 with libadwaita for a modern look and feel.
3.  **Build System:** Use the Meson build system.
4.  **Project Files:** Generate all necessary files, including \`meson.build\`, source files in a subdirectory, \`.ui\` files for UI definitions, and a main application class.
5.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt.
6.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
`;

const getDefaultGenerationPrompt = (userPrompt: string, platform: string): string => `
You are an expert software architect.
Your task is to generate a complete, ready-to-use project structure for an application on the specified platform based on the user's prompt.

**User Prompt:** "${userPrompt}"
**Target Platform:** "${platform}"

**Strict Requirements:**
1.  **Language & Framework:** Choose the most common and modern language and framework suitable for the target platform.
2.  **Architecture:** Implement a clean and scalable architecture pattern (e.g., MVVM, MVC).
3.  **Project Files:** Generate all necessary configuration and source files for a functional starting point.
4.  **Functionality:** The generated code should be a functional starting point that reflects the user's prompt.
5.  **Output Format:** Return a single JSON object with the project name and a flat list of all files, including their full path and content.
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

export const fixCode = async (code: string, error: string): Promise<string> => {
  const ai = getAIClient();

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Use a capable model for fixing
    contents: `Fix the following code which has this simulated error: ${error}\n\nCode:\n${code}`,
  });
  
  return response.text || code;
};

export const optimizeAndCorrectCode = async (fullCode: string, project: Project): Promise<string> => {
  const ai = getAIClient();
  const activeProvider = project.config.cloudAIProviders.find(p => p.id === project.config.activeAIProviderId);
  const model = activeProvider?.model || 'gemini-3-pro-preview';

  const response = await ai.models.generateContent({
    model: model,
    contents: `You are an expert software engineer. Analyze, optimize, and correct the following collection of files from a software project. Refactor for performance, fix potential bugs, and enhance security. Return only the complete, corrected code, maintaining the original file separation comments.
    
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
