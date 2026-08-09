"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/jobs?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <section className="pb-4 pt-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="ml-auto flex w-full max-w-md justify-end">
          <form onSubmit={handleSearch} className="flex w-full items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search jobs, results, exams..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600/30"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-10 shrink-0 rounded-lg bg-gradient-to-r from-[#1e3a5f] to-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#16304e] hover:to-blue-800"
            >
              <Search className="mr-1.5 h-4 w-4" />
              Search
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}