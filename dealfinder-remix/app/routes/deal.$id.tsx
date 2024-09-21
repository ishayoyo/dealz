// app/routes/deal.$id.tsx
import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Box, Heading, Image, Text, VStack, HStack, Badge, Button } from "@chakra-ui/react";
import { fetchDealById } from "~/utils/api.server";
import Layout from "~/components/Layout";

export const loader = async ({ params }: LoaderArgs) => {
  const deal = await fetchDealById(params.id);
  return json({ deal });
};

export default function DealPage() {
  const { deal } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <Box maxWidth="800px" margin="auto" padding={8}>
        <VStack spacing={6} align="stretch">
          <Image src={deal.imageUrl} alt={deal.title} borderRadius="md" />
          <Heading>{deal.title}</Heading>
          <HStack justifyContent="space-between">
            <Badge colorScheme="green" fontSize="xl" padding={2}>
              ${deal.price}
            </Badge>
            <Text fontSize="lg" color="gray.500">
              Original Price: ${deal.originalPrice}
            </Text>
          </HStack>
          <Text fontSize="lg">{deal.description}</Text>
          <HStack>
            <Badge>{deal.category}</Badge>
            <Text>Posted by: {deal.user?.username}</Text>
          </HStack>
          <Button colorScheme="blue" as="a" href={deal.url} target="_blank" rel="noopener noreferrer">
            Go to Deal
          </Button>
        </VStack>
      </Box>
    </Layout>
  );
}