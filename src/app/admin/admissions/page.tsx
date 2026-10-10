"use client";

import ListPage from "@/components/admin/list/ListPage";
import { admissionsConfig } from "./config";

export default function AdminAdmissions() {
  return <ListPage config={admissionsConfig} />;
}
