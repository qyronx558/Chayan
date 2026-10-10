"use client";

import ListPage from "@/components/admin/list/ListPage";
import { answerKeysConfig } from "./config";

export default function AdminAnswerKeys() {
  return <ListPage config={answerKeysConfig} />;
}
