// app/routes/_index.tsx
import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Box } from "@chakra-ui/react";
import DealGrid from "~/components/DealGrid";
import { fetchDeals } from "~/utils/api.server";

export const loader = async ({ request }: LoaderArgs) => {
  const deals = await fetchDeals();
  return json({ deals });
};

export default function Index() {
  const { deals } = useLoaderData<typeof loader>();

  return (
    <Box>
      <DealGrid deals={deals} />
    </Box>
  );
}