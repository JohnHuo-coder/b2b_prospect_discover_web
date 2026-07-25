export type SelectedIndustry = {
  id: number;
  label: string;
};

export function industriesFromState(
  labels: string[],
  ids: number[]
): SelectedIndustry[] {
  const selected: SelectedIndustry[] = [];
  const seen = new Set<number>();

  for (let index = 0; index < Math.max(labels.length, ids.length); index += 1) {
    const label = labels[index]?.trim() ?? "";
    const id = Number(ids[index]);

    if (!label || !Number.isInteger(id) || id < 1 || seen.has(id)) {
      continue;
    }

    seen.add(id);
    selected.push({ id, label });
  }

  return selected;
}

export function splitIndustrySelection(selection: SelectedIndustry[]): {
  industry: string[];
  industry_id: number[];
} {
  return {
    industry: selection.map((item) => item.label),
    industry_id: selection.map((item) => item.id),
  };
}
