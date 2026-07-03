"use client";

import { CategoryMultiSelect } from "@/components/ui/CategoryMultiSelect";
import { TagInput } from "@/components/ui/TagInput";
import {
  DEFAULT_CONTACT_TITLES,
  formatDefaultContactTitlesHelp,
} from "@/lib/constants/config-defaults";
import {
  normalizeContactCategories,
  type ContactCategory,
} from "@/lib/constants/contact-categories";

export function ContactPreferencesEditForm({
  contactTitles,
  contactCategories,
  onContactTitlesChange,
  onContactCategoriesChange,
}: {
  contactTitles: string[];
  contactCategories: string[];
  onContactTitlesChange: (titles: string[]) => void;
  onContactCategoriesChange: (categories: ContactCategory[]) => void;
}) {
  const normalizedCategories = normalizeContactCategories(contactCategories);

  return (
    <div className="space-y-4">
      <TagInput
        label="Contact Titles (for Apollo API)"
        hint="Type a title and press Enter to add it."
        tags={contactTitles}
        onChange={onContactTitlesChange}
        placeholder="Director of Sales"
        helpContent={formatDefaultContactTitlesHelp()}
        onRestoreDefaults={() => onContactTitlesChange([...DEFAULT_CONTACT_TITLES])}
      />
      <CategoryMultiSelect
        label="Contact Categories (for Anymail Finder)"
        hint="Optional. Select one or more categories from the list."
        value={normalizedCategories}
        onChange={onContactCategoriesChange}
      />
    </div>
  );
}
