// app/routes/deals.new.tsx
import { ActionArgs, redirect } from "@remix-run/node";
import { createDeal } from "~/utils/api.server";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const dealData = Object.fromEntries(formData);
  
  try {
    const newDeal = await createDeal(dealData);
    return redirect(`/deal/${newDeal._id}`);
  } catch (error) {
    // Handle error
    console.error("Failed to create deal:", error);
    return null;
  }
};

// This route doesn't need to render anything as it's just handling the form submission
export default function NewDeal() {
  return null;
}