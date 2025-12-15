"use client";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { usePathname } from "next/navigation";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const addb = [
    [{ title: "Dashboard", href: "/dashboard/lecturer" }],
    [
      { title: "Dashboard", href: "/dashboard/lecturer" },
      { title: "Course Materials", href: "/dashboard/lecturer/materials" },
    ],
    [
      { title: "Dashboard", href: "/dashboard/lecturer" },
      { title: "Self Study", href: "/dashboard/lecturer/self-study" },
    ],
    [
      { title: "Dashboard", href: "/dashboard/lecturer" },
      { title: "Assignments", href: "/dashboard/lecturer/assignments" },
    ],
    [
      { title: "Dashboard", href: "/dashboard/lecturer" },
      { title: "Tests", href: "/dashboard/lecturer/tests" },
    ],
    [
      { title: "Dashboard", href: "/dashboard/lecturer" },
      { title: "Video Understanding", href: "/dashboard/lecturer/video" },
    ],
    [
      { title: "Dashboard", href: "/dashboard/lecturer" },
      { title: "LaTeX Generator", href: "/dashboard/lecturer/latex" },
    ],
  ];

  let currentBreadCrumb: { title: string; href: string }[] = [];

  switch (pathname) {
    case "/dashboard/lecturer":
      currentBreadCrumb = addb[0];
      break;
    case "/dashboard/lecturer/materials":
      currentBreadCrumb = addb[1];
      break;
    case "/dashboard/lecturer/self-study":
      currentBreadCrumb = addb[2];
      break;
    case "/dashboard/lecturer/assignments":
      currentBreadCrumb = addb[3];
      break;
    case "/dashboard/lecturer/tests":
      currentBreadCrumb = addb[4];
      break;
    case "/dashboard/lecturer/video":
      currentBreadCrumb = addb[5];
      break;
    case "/dashboard/lecturer/latex":
      currentBreadCrumb = addb[6];
      break;
    default:
      currentBreadCrumb;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-light)",
      }}
    >
      <DashboardSidebar role="lecturer" courses={[]} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <DashboardTopBar breadcrumbs={currentBreadCrumb} />
        {children}
      </div>
    </div>
  );
}
