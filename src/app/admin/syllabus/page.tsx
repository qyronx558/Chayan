"use client";

import ListPage from "@/components/admin/list/ListPage";
import { syllabusConfig } from "./config";

export default function AdminSyllabus() {
  return <ListPage config={syllabusConfig} />;
}
