// app/components/DealGrid.tsx
import { SimpleGrid } from "@chakra-ui/react";
import DealCard from "./DealCard";
import type { Deal } from "~/types";

interface DealGridProps {
  deals: Deal[];
}

export default function DealGrid({ deals }: DealGridProps) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
      {deals.map((deal) => (
        <DealCard key={deal._id} deal={deal} />
      ))}
    </SimpleGrid>
  );
}