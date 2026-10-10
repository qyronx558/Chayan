"use client";

import ListPage from "@/components/admin/list/ListPage";
import { admitCardsConfig } from "./config";

export default function AdminAdmitCards() {
  return <ListPage config={admitCardsConfig} />;
}
