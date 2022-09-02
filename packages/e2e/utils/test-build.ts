import { InlineConfig, build as viteBuild } from "vite";

export async function testBuild(config: InlineConfig) {
  const logs: string[] = [];
  try {
    const logCollector = (...args: any[]) => {
      logs.push(args.join(" "));
    };
    const writeNoop = () => true;
    const spies: jest.SpyInstance[] = [
      jest.spyOn(console, "log").mockImplementation(logCollector),
      jest.spyOn(console, "info").mockImplementation(logCollector),
      jest.spyOn(console, "debug").mockImplementation(logCollector),
      jest.spyOn(console, "warn").mockImplementation(logCollector),
      jest.spyOn(console, "error").mockImplementation(logCollector),
      jest.spyOn(process.stdout, "write").mockImplementation(writeNoop),
      jest.spyOn(process.stderr, "write").mockImplementation(writeNoop),
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
