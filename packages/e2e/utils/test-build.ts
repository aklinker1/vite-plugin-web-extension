import { InlineConfig, build as viteBuild } from "vite";
import { vi, SpyInstance } from "vitest";

export async function testBuild(config: InlineConfig) {
  const logs: string[] = [];
  try {
    const logCollector = (...args: any[]) => {
      logs.push(args.join(" "));
    };
    const writeNoop = () => true;
    const spies: SpyInstance[] = [
      vi.spyOn(console, "log").mockImplementation(logCollector),
      vi.spyOn(console, "info").mockImplementation(logCollector),
      vi.spyOn(console, "debug").mockImplementation(logCollector),
      vi.spyOn(console, "warn").mockImplementation(logCollector),
      vi.spyOn(console, "error").mockImplementation(logCollector),
      vi.spyOn(process.stdout, "write").mockImplementation(writeNoop),
      vi.spyOn(process.stderr, "write").mockImplementation(writeNoop),
    ];

    await viteBuild(config);

    spies.forEach((s) => s.mockRestore());

    return removeColors(logs.join("\n"));
  } catch (err) {
    const output = logs.join("\n");
    process.stdout.write(output + "\n");
    throw err;
  }
}

function removeColors(string: string): string {
  return string.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}
