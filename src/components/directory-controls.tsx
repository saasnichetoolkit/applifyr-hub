import { Search } from "lucide-react";

import { CATEGORIES } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ALL_CATEGORIES = "all";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  showCategorySelect?: boolean;
};

export function DirectoryControls({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  showCategorySelect = true,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search apps, taglines, categories…"
          aria-label="Search apps"
          className="bg-card pl-9"
        />
      </div>

      {showCategorySelect ? (
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full bg-card sm:w-64" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {CATEGORIES.map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
