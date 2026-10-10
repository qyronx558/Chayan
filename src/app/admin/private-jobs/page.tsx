"use client";

import ListPage from "@/components/admin/list/ListPage";
import { privateJobsConfig } from "./config";

export default function AdminPrivateJobs() {
  return <ListPage config={privateJobsConfig} />;
}
