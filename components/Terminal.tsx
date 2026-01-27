import React, { useEffect, useRef } from 'react';
import { Terminal as XtermTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { Project, FileNode } from '../types';
import { TerminalService } from '../services/terminalService';

interface TerminalProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

const Terminal: React.FC<TerminalProps> = ({ project, setProject }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<XtermTerminal | null>(null);
  const terminalService = useRef<TerminalService | null>(null);
  const command = useRef('');

  useEffect(() => {
    if (!terminalRef.current || term.current) return;

    const xterm = new XtermTerminal({
      cursorBlink: true,
      fontFamily: '"Fira Code", monospace',
      fontSize: 13,
      theme: {
        background: '#09090b',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      allowProposedApi: true,
    });
    
    term.current = xterm;
    terminalService.current = new TerminalService(project, setProject);

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon());
    xterm.open(terminalRef.current);
    fitAddon.fit();

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    const prompt = () => {
      command.current = '';
      xterm.write(`\r\n\x1b[1;34m${terminalService.current?.cwd}\x1b[0m $ `);
    };

    xterm.writeln('Welcome to ZERO Terminal!');
    xterm.writeln('Type "help" for a list of available commands.');
    prompt();

    xterm.onKey(async ({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.key === 'Enter') {
        xterm.write('\r\n');
        if (command.current.trim() && terminalService.current) {
            const output = await terminalService.current.executeCommand(command.current);
            xterm.write(output.replace(/\n/g, '\r\n'));
        }
        prompt();
      } else if (domEvent.key === 'Backspace') {
        if (command.current.length > 0) {
          xterm.write('\b \b');
          command.current = command.current.slice(0, -1);
        }
      } else if (printable) {
        command.current += key;
        xterm.write(key);
      }
    });

    return () => {
        resizeObserver.disconnect();
        xterm.dispose();
        term.current = null;
    };
  }, []);
  
  // Update terminal service when project changes
  useEffect(() => {
      if (terminalService.current) {
          terminalService.current.updateProject(project);
      }
  }, [project]);

  return <div ref={terminalRef} className="w-full h-full p-2" />;
};

export default Terminal;
