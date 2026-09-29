import { DashboardGate } from "@/components/dashboard/dashboard-gate";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <DashboardGate>{children}</DashboardGate>;
}
