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
    [{ title: "Dashboard", href: "/dashboard/student" }],
    [
      { title: "Dashboard", href: "/dashboard/student" },
      { title: "Course Materials", href: "/dashboard/student/materials" },
    ],
    [
      { title: "Dashboard", href: "/dashboard/student" },
      { title: "Self Study", href: "/dashboard/student/self-study" },
    ],
    [
      { title: "Dashboard", href: "/dashboard/student" },
      { title: "Assignments", href: "/dashboard/student/assignments" },
    ],
    [
      { title: "Dashboard", href: "/dashboard/student" },
      { title: "Tests", href: "/dashboard/student/tests" },
    ],
    [
      { title: "Dashboard", href: "/dashboard/student" },
      { title: "Video Understanding", href: "/dashboard/student/video" },
    ],
    [
      { title: "Dashboard", href: "/dashboard/student" },
      { title: "LaTeX Generator", href: "/dashboard/student/latex" },
    ],
  ];

  let currentBreadCrumb: { title: string; href: string }[] = [];

  switch (pathname) {
    case "/dashboard/student":
      currentBreadCrumb = addb[0];
      break;
    case "/dashboard/student/materials":
      currentBreadCrumb = addb[1];
      break;
    case "/dashboard/student/self-study":
      currentBreadCrumb = addb[2];
      break;
    case "/dashboard/student/assignments":
      currentBreadCrumb = addb[3];
      break;
    case "/dashboard/student/tests":
      currentBreadCrumb = addb[4];
      break;
    case "/dashboard/student/video":
      currentBreadCrumb = addb[5];
      break;
    case "/dashboard/student/latex":
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
      <DashboardSidebar role="student" courses={[]} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <DashboardTopBar breadcrumbs={currentBreadCrumb} />
        {children}
      </div>
    </div>
  );
}
