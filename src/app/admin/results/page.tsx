"use client";

import ListPage from "@/components/admin/list/ListPage";
import { resultsConfig } from "./config";

export default function AdminResults() {
  return <ListPage config={resultsConfig} />;
}
