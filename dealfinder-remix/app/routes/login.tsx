// app/routes/login.tsx
import { ActionArgs, json, redirect } from "@remix-run/node";
import { login, createUserSession } from "~/utils/auth.server";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const user = await login({ email, password });
    return createUserSession(user.id, "/");
  } catch (error: any) {
    console.error("Login error:", error);
    return json({ 
      errors: { 
        email: "Invalid email or password",
        password: "Invalid email or password"
      } 
    }, { status: 400 });
  }
};

export default function Login() {
  return null; // The form is rendered in the AuthModal
}
