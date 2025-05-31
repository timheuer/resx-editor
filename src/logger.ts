import * as vscode from 'vscode';

type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'verbose';

export class Logger {
    private static _instance: Logger;
    private readonly channel: vscode.LogOutputChannel;
    private logLevel: LogLevel;

    private constructor() {
        this.channel = vscode.window.createOutputChannel("ResX Editor", { log: true });
        this.logLevel = vscode.workspace.getConfiguration("resx-editor").get("loggingLevel", "info");

        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration("resx-editor.loggingLevel")) {
                this.logLevel = this.getConfigLevel();
            }
        });
    }

    public static get instance(): Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger();        }
        return Logger._instance;
    }

    private getConfigLevel(): LogLevel {
        return vscode.workspace.getConfiguration("resx-editor").get<LogLevel>("loggingLevel", "info");
    }

    public info(message: string) {
        if (this.shouldLog("info")) {this.channel.info(message);}
    }

    public warn(message: string) {
        if (this.shouldLog("warn")) {this.channel.warn(message);}
    }

    public error(message: string) {
        if (this.shouldLog("error")) {this.channel.error(message);}
    }

    private shouldLog(level: LogLevel): boolean {
        // If logging is turned off, don't log anything
        if (this.logLevel === 'off') {
            return false;
        }
        
        // If verbose mode is enabled, always log everything
        if (this.logLevel === 'verbose') {
            return level !== 'off' && level !== 'verbose';
        }
        
        // Otherwise, honor the log level hierarchy
        const levels: LogLevel[] = ["off", "error", "warn", "info", "verbose"];
        return levels.indexOf(level) <= levels.indexOf(this.logLevel);
    }
}
