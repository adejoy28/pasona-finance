declare module "web-push" {
  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function sendNotification(
    subscription: unknown,
    payload?: string | Buffer | null,
    options?: Record<string, unknown>,
  ): Promise<unknown>;
  export function generateVAPIDKeys(): { publicKey: string; privateKey: string };
}
