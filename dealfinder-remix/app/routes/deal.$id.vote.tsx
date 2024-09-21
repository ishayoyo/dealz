// app/routes/deal.$id.vote.tsx
import { ActionArgs, json, redirect } from "@remix-run/node";
import { voteDeal } from "~/utils/api.server";

export const action = async ({ params, request }: ActionArgs) => {
  const formData = await request.formData();
  const voteType = formData.get("voteType");

  if (!params.id || (voteType !== "up" && voteType !== "down")) {
    return json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await voteDeal(params.id, voteType === "up" ? 1 : -1);
    return redirect(`/deal/${params.id}`);
  } catch (error) {
    console.error("Failed to vote:", error);
    return json({ error: "Failed to vote" }, { status: 500 });
  }
};

// This route doesn't need to render anything as it's just handling the form submission
export default function Vote() {
  return null;
}