import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      openclawId?: string;
      isHuman?: boolean;
    } & DefaultSession["user"];
  }
}
