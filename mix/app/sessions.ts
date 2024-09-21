import { createCookieSessionStorage } from "@remix-run/node";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax",
      secrets: ["s3cr3t"], // replace with a real secret
      secure: process.env.NODE_ENV === "production",
    },
  });

export { getSession, commitSession, destroySession };