export interface ExtensionRunner {
  openBrowser(): Promise<void>;
  reload(): Promise<void>;
  exit(): Promise<void>;
}
