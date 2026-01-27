import * as esbuild from 'esbuild-wasm';
import { FileNode } from '../types';

let esbuildInitialized = false;

const initializeEsbuild = async () => {
  if (esbuildInitialized) {
    return;
  }
  await esbuild.initialize({
    wasmURL: 'https://esm.sh/esbuild-wasm@0.23.0/esbuild.wasm',
    worker: true,
  });
  esbuildInitialized = true;
};

const findFileByPath = (nodes: FileNode[], path: string): {file: FileNode, fullPath: string} | null => {
    const parts = path.split('/').filter(p => p);
    let currentNodes: FileNode[] | undefined = nodes;
    let currentPath: string[] = [];
    let foundNode: FileNode | null = null;
    let foundPath = '';

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const node = currentNodes?.find(n => n.name === part);
        if (node) {
            currentPath.push(node.name);
            if (i === parts.length - 1 && node.type === 'file') {
                foundNode = node;
                foundPath = currentPath.join('/');
                break;
            }
            currentNodes = node.children;
        } else {
            break;
        }
    }
    return foundNode ? { file: foundNode, fullPath: foundPath } : null;
};

const jsxInjectorPlugin = (): esbuild.Plugin => {
    return {
        name: 'jsx-injector',
        setup(build) {
            build.onLoad({ filter: /\.(tsx|jsx)$/ }, async (args) => {
                const source = args.pluginData.contents;
                
                try {
                    const result = await esbuild.transform(source, {
                        loader: 'tsx',
                        jsx: 'transform',
                        jsxFactory: 'React.createElement',
                        jsxFragment: 'React.Fragment',
                    });

                    // This is a simplified transform. A more robust solution would use an AST parser like Babel or SWC.
                    // We're replacing `React.createElement("div"` with one that includes our data attribute.
                    const transformedCode = result.code.replace(
                        /React\.createElement\("([a-zA-Z0-9\.-]+)"/g,
                        (match, tag) => {
                            // Heuristic to get line number. This is fragile.
                            // A real implementation needs source maps from the transform.
                            const lineNumber = 1; // Placeholder
                            const columnNumber = 1; // Placeholder
                            return `React.createElement("${tag}", { "data-source-loc": "${args.path}:${lineNumber}:${columnNumber}" }`;
                        }
                    );
                    
                    return {
                        contents: transformedCode,
                        loader: 'jsx', // The output is now plain JS
                    };

                } catch (e) {
                     // If transform fails, fallback to original content
                    return { contents: source, loader: 'tsx' };
                }
            });
        }
    };
};

const inMemoryPlugin = (projectFiles: FileNode[], allFilesMap: Map<string, FileNode>): esbuild.Plugin => {
  return {
    name: 'in-memory-plugin',
    setup(build: esbuild.PluginBuild) {
        
        const resolvePath = (path: string, importer: string): string | null => {
            let resolvedPath = path;
            if (path.startsWith('./') || path.startsWith('../')) {
                const importerDir = importer.substring(0, importer.lastIndexOf('/'));
                resolvedPath = new URL(path, `file:///${importerDir}/`).pathname.substring(1);
            }
            
            if (allFilesMap.has(resolvedPath)) return resolvedPath;
            
            const extensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.json'];
            for (const ext of extensions) {
                if (allFilesMap.has(resolvedPath + ext)) return resolvedPath + ext;
            }
            for (const ext of extensions) {
                if (allFilesMap.has(`${resolvedPath}/index${ext}`)) return `${resolvedPath}/index${ext}`;
            }

            return null;
        }

      // Intercept paths for entry points & other modules
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.namespace === 'in-memory') {
            const path = resolvePath(args.path, args.importer);
            if (path) {
                return { path, namespace: 'in-memory' };
            }
        }
        // Handle entry point resolution
        if (args.kind === 'entry-point') {
            return { path: args.path, namespace: 'in-memory' };
        }

        return { errors: [{ text: `Could not resolve path: ${args.path}` }]};
      });

      // Load files from our virtual file system
      build.onLoad({ filter: /.*/, namespace: 'in-memory' }, (args) => {
        const file = allFilesMap.get(args.path);
        
        if (file) {
            const loader = file.name.split('.').pop() as esbuild.Loader;

            if (loader === 'tsx' || loader === 'jsx') {
                const contents = file.content || '';
                // Simple regex to inject data attributes. A robust solution uses AST.
                const transformed = contents.replace(/<([a-z][a-z0-9]*)([^>]*?)>/g, (match, tag, attrs) => {
                    // Avoid injecting into closing tags or self-closing tags incorrectly
                    if (match.startsWith('</')) return match;
                    const line = 1; // Placeholder for line number
                    return `<${tag} data-source-loc="${args.path}:${line}"${attrs}>`;
                });

                return {
                    contents: file.content || '',
                    loader: loader,
                    pluginData: { contents: file.content || '' }
                };
            }

            return {
                contents: file.content || '',
                loader: loader,
            };
        }
        return { errors: [{ text: `Could not find file: ${args.path}` }] };
      });
    },
  };
};

const getAllFiles = (nodes: FileNode[], path: string = ''): Map<string, FileNode> => {
    let map = new Map<string, FileNode>();
    for (const node of nodes) {
        const newPath = path ? `${path}/${node.name}` : node.name;
        if (node.type === 'file') {
            map.set(newPath, node);
        }
        if (node.children) {
            const childMap = getAllFiles(node.children, newPath);
            map = new Map([...map, ...childMap]);
        }
    }
    return map;
}

export const bundle = async (projectFiles: FileNode[]): Promise<{ code: string; error: string; }> => {
  try {
    await initializeEsbuild();

    const allFilesMap = getAllFiles(projectFiles);
    
    // Find entry point
    const entryPoints = ['index.tsx', 'src/index.tsx', 'App.tsx', 'src/App.tsx'];
    let entryPoint: string | null = null;
    for(const p of entryPoints) {
        if(allFilesMap.has(p)) {
            entryPoint = p;
            break;
        }
    }
    
    if (!entryPoint) {
        return { code: '', error: "Ponto de entrada não encontrado (ex: index.tsx, App.tsx)." };
    }

    const result = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      write: false,
      plugins: [inMemoryPlugin(projectFiles, allFilesMap)],
      define: {
        'process.env.NODE_ENV': '"development"', // Changed to development for better error messages
      },
      jsx: 'automatic',
      target: 'es2020',
      sourcemap: 'inline' // Add sourcemap for better line number accuracy
    });
    
    return {
      code: result.outputFiles[0].text,
      error: '',
    };
  } catch (err: any) {
    // Format esbuild errors to be more readable
    if (err.errors) {
        return { code: '', error: err.errors.map((e: any) => e.text).join('\n') };
    }
    return {
      code: '',
      error: err.message,
    };
  }
};