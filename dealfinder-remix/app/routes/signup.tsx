// app/routes/signup.tsx
import { ActionArgs, json, redirect } from "@remix-run/node";
import { signup, createUserSession } from "~/utils/auth.server";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const user = await signup({ username, email, password });
    return createUserSession(user.id, "/");
  } catch (error: any) {
    console.error("Signup error:", error);
    return json({ 
      errors: {
        username: "Username may be taken",
        email: "Email may be taken",
        password: "Password must meet requirements"
      } 
    }, { status: 400 });
  }
};

export default function Signup() {
  return null; // The form is rendered in the AuthModal
}