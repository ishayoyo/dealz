import { json, ActionFunction } from "@remix-run/node";
import { getSession, commitSession } from "~/sessions";

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  const isLoggedIn = formData.get("isLoggedIn") === "true";

  session.set("isLoggedIn", isLoggedIn);

  return json(
    { isLoggedIn },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};