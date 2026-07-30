"use client";

import { ChevronsDown, ChevronsUp } from "lucide-react";
import ElasticSlider from "@/components/ElasticSlider";
import { FormLabelRow } from "@/components/ui/HelpTooltip";
import {
  DEFAULT_FIT_SCORE_CUTOFF,
  FIT_SCORE_CUTOFF_HELP,
  formatDefaultFitScoreCutoffHelp,
} from "@/lib/constants/scoring-thresholds";

const SCORING_THRESHOLD_MIN = 0;
const SCORING_THRESHOLD_MAX = 100;

type FitScoreCutoffSliderProps = {
  value: number | null;
  onChange: (value: number) => void;
  onRestoreDefaults?: () => void;
};

export function FitScoreCutoffSlider({
  value,
  onChange,
  onRestoreDefaults,
}: FitScoreCutoffSliderProps) {
  const sliderValue = value ?? DEFAULT_FIT_SCORE_CUTOFF;

  return (
    <div className="block">
      <FormLabelRow
        label="Fit Score Cutoff"
        required
        helpContent={`${FIT_SCORE_CUTOFF_HELP}\n${formatDefaultFitScoreCutoffHelp()}`}
        onRestoreDefaults={onRestoreDefaults}
      />
      <ElasticSlider
        className="slider-container--full"
        leftIcon={<ChevronsDown className="icon" aria-hidden />}
        rightIcon={<ChevronsUp className="icon" aria-hidden />}
        startingValue={SCORING_THRESHOLD_MIN}
        value={sliderValue}
        maxValue={SCORING_THRESHOLD_MAX}
        isStepped={false}
        stepSize={1}
        onChange={onChange}
      />
      <p className="mt-1.5 text-xs text-zinc-500">
        Must be between {SCORING_THRESHOLD_MIN} and {SCORING_THRESHOLD_MAX}.
        Lower is more lenient; higher is stricter.
      </p>
    </div>
  );
}
