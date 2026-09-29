import { FarmDetailsView } from "@/components/views/farm-details-view";

export default async function FarmDetailsPage({ params }: PageProps<"/dashboard/farms/[id]">) {
  const { id } = await params;
  return <FarmDetailsView id={id} />;
}
