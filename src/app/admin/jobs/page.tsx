"use client";

import ListPage from "@/components/admin/list/ListPage";
import { jobsConfig } from "./config";

export default function AdminJobs() {
  return <ListPage config={jobsConfig} />;
}
