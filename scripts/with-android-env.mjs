import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const [, , ...args] = process.argv;

if (args.length === 0) {
  console.error("Usage: node scripts/with-android-env.mjs <command> [...args]");
  process.exit(1);
}

const projectRoot = process.cwd();
const androidDir = path.join(projectRoot, "android");
const localPropertiesPath = path.join(androidDir, "local.properties");

function detectAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.platform === "win32"
      ? path.join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk")
      : null,
    process.platform === "darwin"
      ? path.join(os.homedir(), "Library", "Android", "sdk")
      : null,
    process.platform === "linux"
      ? path.join(os.homedir(), "Android", "Sdk")
      : null,
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate));
}

function ensureAndroidLocalProperties(sdkPath) {
  if (!existsSync(androidDir)) {
    return;
  }

  const escapedSdkPath = sdkPath.replace(/\\/g, "\\\\");
  const nextContents = `sdk.dir=${escapedSdkPath}\n`;
  const currentContents = existsSync(localPropertiesPath)
    ? readFileSync(localPropertiesPath, "utf8")
    : "";

  if (currentContents !== nextContents) {
    writeFileSync(localPropertiesPath, nextContents, "utf8");
  }
}

function resolveExecutable(command) {
  if (path.isAbsolute(command) || command.includes("/") || command.includes("\\")) {
    return command;
  }

  const binDir = path.join(projectRoot, "node_modules", ".bin");
  const candidates =
    process.platform === "win32"
      ? [path.join(binDir, `${command}.cmd`), path.join(binDir, command)]
      : [path.join(binDir, command)];

  return candidates.find((candidate) => existsSync(candidate)) ?? command;
}

function resolveCommand(command, commandArgs) {
  if (command === "expo") {
    return {
      file: process.execPath,
      args: [path.join(projectRoot, "node_modules", "expo", "bin", "cli"), ...commandArgs],
    };
  }

  const resolvedFile = resolveExecutable(command);

  if (
    process.platform === "win32" &&
    (resolvedFile.endsWith(".cmd") || resolvedFile.endsWith(".bat"))
  ) {
    const quoteForCmd = (value) => {
      if (!value) {
        return '""';
      }

      if (!/[\s"&()<>^|]/.test(value)) {
        return value;
      }

      return `"${value.replace(/"/g, '""')}"`;
    };

    const commandLine = [resolvedFile, ...commandArgs].map(quoteForCmd).join(" ");

    return {
      file: process.env.ComSpec ?? "cmd.exe",
      args: ["/d", "/s", "/c", commandLine],
    };
  }

  return {
    file: resolvedFile,
    args: commandArgs,
  };
}

const sdkPath = detectAndroidSdk();

if (!sdkPath) {
  console.error(
    [
      "Android SDK not found.",
      "Install it via Android Studio or set ANDROID_HOME/ANDROID_SDK_ROOT before running this command.",
    ].join(" "),
  );
  process.exit(1);
}

process.env.ANDROID_HOME = sdkPath;
process.env.ANDROID_SDK_ROOT = sdkPath;

const pathEntries = [
  path.join(sdkPath, "platform-tools"),
  path.join(sdkPath, "emulator"),
  path.join(sdkPath, "cmdline-tools", "latest", "bin"),
].filter((entry) => existsSync(entry));

process.env.PATH = `${pathEntries.join(path.delimiter)}${path.delimiter}${process.env.PATH ?? ""}`;

ensureAndroidLocalProperties(sdkPath);

const resolvedCommand = resolveCommand(args[0], args.slice(1));

const child = spawn(resolvedCommand.file, resolvedCommand.args, {
  stdio: "inherit",
  shell: false,
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
