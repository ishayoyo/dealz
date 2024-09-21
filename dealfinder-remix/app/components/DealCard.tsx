// app/components/DealCard.tsx
import { Box, Image, Text, VStack, Heading, Badge, Button, HStack, IconButton } from "@chakra-ui/react";
import { Link, Form } from "@remix-run/react";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import type { Deal } from "~/types";

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md">
      <Image src={deal.imageUrl} alt={deal.title} height="200px" objectFit="cover" />
      <VStack align="start" p={4} spacing={2}>
        <Heading size="md" noOfLines={2}>
          {deal.title}
        </Heading>
        <Text fontSize="xl" fontWeight="bold" color="green.500">
          ${deal.price}
        </Text>
        <Text noOfLines={3}>{deal.description}</Text>
        <HStack justifyContent="space-between" width="100%">
          <Badge colorScheme="blue">{deal.category}</Badge>
          <HStack>
            <Form method="post" action={`/deal/${deal._id}/vote`}>
              <input type="hidden" name="voteType" value="up" />
              <IconButton
                aria-label="Upvote"
                icon={<ChevronUpIcon />}
                colorScheme="green"
                variant="ghost"
                type="submit"
              />
            </Form>
            <Text fontWeight="bold">{deal.voteCount}</Text>
            <Form method="post" action={`/deal/${deal._id}/vote`}>
              <input type="hidden" name="voteType" value="down" />
              <IconButton
                aria-label="Downvote"
                icon={<ChevronDownIcon />}
                colorScheme="red"
                variant="ghost"
                type="submit"
              />
            </Form>
          </HStack>
        </HStack>
        <Link to={`/deal/${deal._id}`}>
          <Button size="sm" colorScheme="blue">View Deal</Button>
        </Link>
      </VStack>
    </Box>
  );
}