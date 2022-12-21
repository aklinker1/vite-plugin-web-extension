import { program } from "commander";
import { initProject } from "./src/initProject";

// program.option("--first").option("-s, --separator <char>");

program.parse();

initProject({}).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
