"use client";

import ListPage from "@/components/admin/list/ListPage";
import { blogConfig } from "./config";

export default function AdminBlog() {
  return <ListPage config={blogConfig} />;
}
